const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Importar fs.promises para leer archivos
const { supabaseAdmin } = require('./backend/services/supabase'); // Importar supabaseAdmin
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Para parsear body de requests a JSON

// Security Middlewares
app.use(helmet());
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
const { protect, isAdmin } = require('./backend/middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/admin', protect, isAdmin, adminRoutes);
app.use('/api/user', protect, userRoutes);
app.use('/api/chat', protect, chatRoutes);
app.use('/api', protect, uploadRoutes);

// ==========================================================
// NUEVA RUTA DINÁMICA PARA TIENDAS (por slug)
// ==========================================================
app.get('/store/:slug', async (req, res) => {
  const storeSlug = req.params.slug;
  try {
    // Buscar la tienda por slug en Supabase
    const { data: storeData, error } = await supabaseAdmin
      .from('stores')
      .select('id, data')
      .eq('slug', storeSlug)
      .single();

    if (error || !storeData) {
      console.error(`Tienda no encontrada para slug: ${storeSlug}`, error);
      // Aún podemos necesitar un 404.html del directorio public
      const notFoundPath = path.join(__dirname, 'public', '404.html');
      if (require('fs').existsSync(notFoundPath)) {
        return res.status(404).sendFile(notFoundPath);
      }
      return res.status(404).send('Not Found');
    }

    // Leer la plantilla del visor
    let viewerHtml = await fs.readFile(
      path.join(__dirname, 'public', 'viewer_template.html'),
      'utf8'
    );

    // Inyectar los datos de la tienda en la plantilla
    const injectedData = `<script>window.STORE_DATA = ${JSON.stringify(storeData.data)};</script>`;
    viewerHtml = viewerHtml.replace(
      '<!-- SERVER_DATA_INJECTION -->',
      injectedData
    );

    res.send(viewerHtml);
  } catch (error) {
    console.error('Error al servir la tienda por slug:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// =========================================================
// SERVE STATIC FILES (HTML templates, images, etc. from public)
// =========================================================
app.use(express.static(path.join(__dirname, 'public')));


// =========================================================
// SERVE REACT APP (Single Page Application)
// =========================================================
// Servir los archivos estáticos del build de React
app.use(express.static(path.join(__dirname, 'react-editor', 'dist')));

// El catch-all handler: para cualquier request que no matcheó antes,
// manda el index.html de React. Esto es para el routing en el cliente.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-editor', 'dist', 'index.html'));
});

// Solo iniciar el servidor si el script se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
