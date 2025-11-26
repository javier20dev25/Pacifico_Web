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
          'style-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://ka-f.fontawesome.com'],
          'img-src': ["'self'", "data:", "*.supabase.co"], // <-- AÑADIR ESTA LÍNEA
          'connect-src': ["'self'", "https://ka-f.fontawesome.com"], // Necesario para Font Awesome v6
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

// --- Rutas Públicas de la API (sin autenticación) ---
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes); // La ruta de prueba de subida es pública

// --- Rutas Protegidas de la API (requieren autenticación) ---
app.use('/api/stats', protect, statisticsRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/admin', protect, isAdmin, adminRoutes);
app.use('/api/user', protect, userRoutes);
app.use('/api/chat', protect, chatRoutes);


// ==========================================================
// NUEVA RUTA DINÁMICA PARA TIENDAS (por slug)
// ==========================================================

// Función auxiliar con reintentos para hacer la consulta a Supabase más robusta
async function fetchStoreWithRetries(slug, retries = 3, delay = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('data')
        .eq('slug', slug)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 es "not found", lo cual no es un error de red
        throw error;
      }
      return { data, error };
    } catch (e) {
      console.error(`Intento ${i + 1} fallido para obtener slug '${slug}':`, e.message);
      if (i === retries - 1) throw e; // Lanzar el error en el último intento
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

app.get('/store/:slug', async (req, res, next) => {
  const storeSlug = req.params.slug;
  console.log(`[GET /store/:slug] 1. Iniciando proceso para slug: "${storeSlug}"`);

  try {
    const { data: store, error } = await fetchStoreWithRetries(storeSlug);
    console.log(`[GET /store/:slug] 2. Resultado de fetchStoreWithRetries:`, { store, error: error ? { message: error.message, code: error.code } : null });

    // Verificación explícita de los datos
    if (error) {
      console.error(`[GET /store/:slug] 3a. Error de base de datos detectado:`, error.message);
      return res.status(500).send('Error al consultar la base de datos.');
    }
    if (!store) {
      console.error(`[GET /store/:slug] 3b. La consulta no devolvió una tienda (slug no encontrado).`);
      return res.status(404).send(`Tienda con slug "${storeSlug}" no encontrada.`);
    }
    if (!store.data || typeof store.data !== 'object') {
      console.error(`[GET /store/:slug] 3c. La tienda se encontró, pero la columna 'data' está vacía, nula o no es un objeto.`);
      return res.status(500).send('Los datos de la tienda están corruptos o vacíos.');
    }

    console.log(`[GET /store/:slug] 4. Datos de la tienda validados. Procediendo a leer la plantilla HTML.`);
    
    let viewerHtml = await fs.readFile(
      path.join(__dirname, 'public', 'viewer_template.html'),
      'utf8'
    );

    const previewData = store.data;
    const supabaseConfig = {
      url: process.env.VITE_SUPABASE_URL,
      bucket: process.env.STORAGE_BUCKET || 'imagenes',
    };

    const injectedScript = `<script type="module">
      window.STORE_DATA = ${JSON.stringify(previewData).replace(/<\/script/gi, '<\\/script')};
      window.SUPABASE_CONFIG = ${JSON.stringify(supabaseConfig).replace(/<\/script/gi, '<\\/script')};
    </script>`;
    
    viewerHtml = viewerHtml.replace('__DATA_INJECTION_POINT__', injectedScript);

    console.log(`[GET /store/:slug] 5. Inyección de datos completada. Enviando HTML al cliente.`);
    res.send(viewerHtml);

  } catch (error) {
    console.error(`[GET /store/:slug] 6. Error fatal en el bloque try/catch:`, error);
    next(error);
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
