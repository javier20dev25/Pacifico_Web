require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Importar fs.promises para leer archivos
const { supabaseAdmin } = require('./backend/services/supabase'); // Importar supabaseAdmin

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Para parsear body de requests a JSON
app.use(express.static('public')); // Para servir archivos estáticos (HTML, CSS, JS del cliente)

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

// Rutas de la API
const authRoutes = require('./backend/api/auth');
const adminRoutes = require('./backend/api/admin');
const userRoutes = require('./backend/api/user');
const chatRoutes = require('./backend/api/chat');
const { protect } = require('./backend/middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/admin', protect, adminRoutes);
app.use('/api/user', protect, userRoutes);
app.use('/api/chat', protect, chatRoutes);

// ==========================================================
// NUEVA RUTA DINÁMICA PARA TIENDAS (por slug)
// ==========================================================
app.get('/tienda/:slug', async (req, res) => {
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
            return res.status(404).sendFile(path.join(__dirname, 'public', '404.html')); // Asumiendo que tienes un 404.html
        }

        // Leer la plantilla del visor
        let viewerHtml = await fs.readFile(path.join(__dirname, 'public', 'viewer_template.html'), 'utf8');

        // Inyectar los datos de la tienda en la plantilla
        // Asegúrate de que el JSON.stringify sea seguro para inyectar en HTML
        const injectedData = `<script>window.STORE_DATA = ${JSON.stringify(storeData.data)};</script>`;
        viewerHtml = viewerHtml.replace('<!-- SERVER_DATA_INJECTION -->', injectedData);

        res.send(viewerHtml);

    } catch (error) {
        console.error('Error al servir la tienda por slug:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

// Ruta principal (login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
