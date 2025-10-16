const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/email'); // Importar el servicio de correo

// Middleware para asegurar el parsing de JSON en este router
router.use(express.json());

// --- Helper: Validador de Contraseña ---
function isPasswordStrong(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    return regex.test(password);
}

// ==========================================================
// 1. LOGIN DE USUARIO
// ==========================================================
router.post('/login', async (req, res) => {
    console.log('[DEBUG req.body]', req.body);

    const correo = req.body.correo || req.body.email;
    const password = req.body.contrasena || req.body.password;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    console.log('[DEBUG LOGIN] Intento de login:', correo);

    try {
        const { data: user, error } = await supabaseAdmin
            .from('usuarios')
            .select('*')
            .eq('correo', correo)
            .single();

        if (error || !user) {
            console.log('[DEBUG LOGIN] Usuario no encontrado en DB o error:', error);
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Bloquear si el usuario está suspendido
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Esta cuenta ha sido suspendida. Contacta al administrador.' });
        }

        // bcrypt.compare usando el nombre real de la columna
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Usuario activo, generar token de sesión incluyendo rol y correo
        const sessionToken = jwt.sign({ uuid: user.uuid, rol: user.role, email: user.correo }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ sessionToken, user: { rol: user.role, nombre: user.nombre } });
        
    } catch (error) {
        console.error('[ERROR LOGIN]', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});
// ==========================================================
// 2. COMPLETAR REGISTRO (ACTUALIZAR CONTRASEÑA)
// ==========================================================
router.post('/complete-registration', async (req, res) => {
    const { tempToken, password } = req.body;
    if (!tempToken || !password) {
        return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
    }

    if (!isPasswordStrong(password)) {
        return res.status(400).json({ error: 'La contraseña no es suficientemente fuerte.' });
    }

    try {
        // Verificar el token temporal
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'complete-registration') {
            return res.status(401).json({ error: 'Token inválido para esta operación.' });
        }

        const user_uuid = decoded.uuid;
        const new_password_hash = await bcrypt.hash(password, 10);

        // Actualizar el usuario en la base de datos
        const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('usuarios')
            .update({
                password_hash: new_password_hash,
                status: 'active',
                actualizado_at: new Date()
            })
            .eq('uuid', user_uuid)
            .select('uuid, status, nombre, correo') // Seleccionar nombre y correo para el correo de notificación
            .single();

        if (updateError) throw updateError;

        // Notificar al administrador
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const subject = `✅ Usuario Activado: ${updatedUser.nombre} (${updatedUser.correo})`;
            const text = `El usuario ${updatedUser.nombre} (${updatedUser.correo}) ha completado su registro y activado su cuenta.`;
            const html = `<p>El usuario <strong>${updatedUser.nombre}</strong> (<code>${updatedUser.correo}</code>) ha completado su registro y activado su cuenta.</p>`;
            sendEmail(adminEmail, subject, text, html);
        }

        // Generar un token de sesión normal y duradero
        const sessionToken = jwt.sign(
            { uuid: updatedUser.uuid, status: updatedUser.status },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            status: 'registration_complete',
            message: 'Registro completado. ¡Bienvenido!',
            token: sessionToken
        });

    } catch (error) {
        console.error('Error completando el registro:', error);
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'El token es inválido o ha expirado. Vuelve a iniciar sesión.' });
        }
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
    }
});

module.exports = router;