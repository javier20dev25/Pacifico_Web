require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Importar fs.promises para leer archivos
const { supabaseAdmin } = require('./backend/services/supabase'); // Importar supabaseAdmin
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security Middlewares
// Desactivar Helmet en entorno de test para evitar posibles conflictos con supertest
if (process.env.NODE_ENV !== 'test') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'frame-ancestors': ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
          'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        },
      },
    })
  );
}
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// --- DEBUG TEMPORAL: log de todas las peticiones HTTP ---
app.use((req, res, next) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Ruta pública de prueba para depuración desde el navegador
app.get('/__debug/ping', (req, res) => {
  console.log('[DEBUG] /__debug/ping recibido desde el cliente');
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

// NUEVA RUTA DE DEBUGGING PARA LOGS DEL CLIENTE
app.post('/api/debug/log', (req, res) => {
  const message = req.body.message || 'Mensaje de debug vacío';
  console.log(`[CLIENT-SIDE LOG] ${message}`);
  res.status(200).send({ status: 'logged' });
});

// Rutas de la API
const authRoutes = require('./backend/api/auth');
const adminRoutes = require('./backend/api/admin');
const userRoutes = require('./backend/api/user');
const chatRoutes = require('./backend/api/chat');
const uploadRoutes = require('./backend/api/uploads');
const statisticsRoutes = require('./backend/api/statistics');
const orderRoutes = require('./backend/api/orders');
const { protect, isAdmin } = require('./backend/middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/stats', protect, statisticsRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/admin', protect, isAdmin, adminRoutes);
app.use('/api/user', protect, userRoutes);
app.use('/api/chat', protect, chatRoutes);
app.use('/api', protect, uploadRoutes);

// ==========================================================
// NUEVA RUTA DINÁMICA PARA TIENDAS (por slug)
// ==========================================================
app.get('/store/:slug', async (req, res, next) => {
  const storeSlug = req.params.slug;
  try {
    // Buscar la tienda por slug en Supabase, seleccionando solo la columna 'data'
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('data')
      .eq('slug', storeSlug)
      .single();

    // Si hay un error, la tienda no se encuentra, o no tiene un objeto 'data'
    if (error || !store || !store.data) {
      console.error(`Tienda o datos de la tienda no encontrados para slug: ${storeSlug}`, error);
      return res.status(404).send('Tienda no encontrada');
    }

    // Leer la plantilla del visor desde la ubicación correcta
    let viewerHtml = await fs.readFile(
      path.join(__dirname, 'public', 'viewer_template.html'), // Corregido a la ruta correcta
      'utf8'
    );

    // Preparar los datos para inyección: usamos directamente el contenido de la columna 'data'
    const previewData = store.data;
    const supabaseConfig = {
      url: process.env.VITE_SUPABASE_URL,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
      bucket: process.env.STORAGE_BUCKET || 'imagenes',
    };

    // Inyectar los datos de la tienda y la configuración de Supabase en la plantilla
    const injectedScript = `<script type="module">
      window.STORE_DATA = ${JSON.stringify(previewData).replace(/<\/script/gi, '<\\/script')};
      window.SUPABASE_CONFIG = ${JSON.stringify(supabaseConfig).replace(/<\/script/gi, '<\\/script')};
    </script>`;
    
    viewerHtml = viewerHtml.replace(
      '__DATA_INJECTION_POINT__',
      injectedScript
    );

    res.send(viewerHtml);
  } catch (error) {
    console.error('Error al servir la tienda por slug:', error);
    next(error); // Pasar al manejador de errores
  }
});

// =========================================================
// SERVE STATIC FILES (Vite dev server handles this, but good for prod)
// =========================================================
app.use(express.static(path.join(__dirname, 'react-editor')));


// =========================================================
// SERVE REACT APP (Single Page Application)
// =========================================================
// El catch-all handler: para cualquier request que no sea de API o de tienda,
// manda el index.html de React para que el routing del cliente funcione.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-editor', 'index.html'));
});

// =========================================================
// ERROR HANDLING MIDDLEWARE (debe ser el último)
// =========================================================
const errorHandler = require('./backend/middleware/errorHandler');
app.use(errorHandler);

// Solo iniciar el servidor si el script se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
