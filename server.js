require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Para parsear body de requests a JSON
app.use(express.static('public')); // Para servir archivos estáticos (HTML, CSS, JS del cliente)

// Rutas de la API
const authRoutes = require('./backend/api/auth');
const adminRoutes = require('./backend/api/admin');
const { protect } = require('./backend/middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/admin', protect, adminRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
