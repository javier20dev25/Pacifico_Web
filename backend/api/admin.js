const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase'); // Usamos el cliente de Supabase para la conexión a la DB
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../services/email'); // Importar el servicio de correo

// --- Helper: Generador de Contraseña ---
function generateTemporaryPassword(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// ==========================================================
// 1. CREAR USUARIO TEMPORAL
// ==========================================================
router.post('/create-temporary-user', async (req, res) => {
    const { nombre, correo, plan_nombre: raw_plan_nombre } = req.body;

    // Mapeo de alias para nombres de planes
    const planMap = {
        "plan emprendedor clasico": "emprendedor",
        "oro bisness": "oro_business", // Asumiendo que este es el nombre en la DB
        "oro ejevutivo": "oro_ejecutivo" // Asumiendo que este es el nombre en la DB
    };
    const plan_nombre = planMap[raw_plan_nombre.toLowerCase()] || raw_plan_nombre.toLowerCase(); // Convertir a minúsculas para coincidencia

    if (!nombre || !correo || !plan_nombre) {
        return res.status(400).json({ error: 'Nombre, correo y plan son obligatorios.' });
    }

    const temporaryPassword = generateTemporaryPassword();

    try {
        // Hashear la contraseña temporal
        const password_hash = await bcrypt.hash(temporaryPassword, 10);

        // Iniciar una transacción para asegurar la atomicidad
        const { data, error } = await supabaseAdmin.rpc('create_user_and_contract', {
            p_nombre: nombre,
            p_correo: correo,
            p_password_hash: password_hash,
            p_plan_nombre: plan_nombre
        });

        if (error) throw error;

        // Notificar al administrador
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const subject = `🎉 Nuevo Usuario Temporal Creado: ${nombre} (${correo})`;
            const text = `Se ha creado un nuevo usuario temporal:\nNombre: ${nombre}\nCorreo: ${correo}\nPlan: ${plan_nombre}\nContraseña Temporal: ${temporaryPassword}\n\nRecuerda compartirle las credenciales y el enlace de login.`;
            const html = `<p>Se ha creado un nuevo usuario temporal:</p>\n                          <ul>\n                              <li><strong>Nombre:</strong> ${nombre}</li>\n                              <li><strong>Correo:</strong> ${correo}</li>\n                              <li><strong>Plan:</strong> ${plan_nombre}</li>\n                              <li><strong>Contraseña Temporal:</strong> <code>${temporaryPassword}</code></li>\n                          </ul>\n                          <p>Recuerda compartirle las credenciales y el enlace de login.</p>`;
            sendEmail(adminEmail, subject, text, html);
        }

        res.status(201).json({
            message: 'Usuario temporal y contrato creados con éxito.',
            credentials: {
                correo: correo,
                password: temporaryPassword
            }
        });

    } catch (error) {
        console.error('Error en la transacción de creación de usuario:', error);
        if (error.code === '23505') { // unique_violation en el correo
            return res.status(409).json({ error: 'El correo electrónico ya está en uso.' });
        }
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// ==========================================================
// 2. LISTAR TODOS LOS USUARIOS (usando la VISTA)
// ==========================================================
router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('vw_usuarios_planes')
            .select('*');

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener la vista de usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// ==========================================================
// 3. REVOCAR/ELIMINAR USUARIO
// ==========================================================
router.post('/revoke-user', async (req, res) => {
    const { userUuid } = req.body;

    if (!userUuid) {
        return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
    }

    try {
        // Eliminar el usuario de la tabla 'usuarios'
        const { error } = await supabaseAdmin
            .from('usuarios')
            .delete()
            .eq('uuid', userUuid);

        if (error) throw error;

        res.json({ message: 'Usuario eliminado correctamente.' });

    } catch (error) {
        console.error('Error al revocar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// ==========================================================
// 4. SUSPENDER USUARIO
// ==========================================================
router.post('/suspend-user', async (req, res) => {
    const { userUuid } = req.body;

    if (!userUuid) {
        return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('usuarios')
            .update({ status: 'suspended', actualizado_at: new Date() })
            .eq('uuid', userUuid);

        if (error) throw error;

        res.json({ message: 'Usuario suspendido correctamente.' });

    } catch (error) {
        console.error('Error al suspender usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// ==========================================================
// 5. RENOVAR CONTRATO
// ==========================================================
router.post('/renew-contract', async (req, res) => {
    const { userUuid } = req.body;

    if (!userUuid) {
        return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
    }

    try {
        // Obtener el contrato activo actual
        const { data: currentContract, error: contractError } = await supabaseAdmin
            .from('contratos')
            .select('id, fecha_expiracion')
            .eq('usuario_uuid', userUuid)
            .eq('activo', true)
            .single();

        if (contractError || !currentContract) {
            return res.status(404).json({ error: 'No se encontró un contrato activo para este usuario.' });
        }

        // Calcular nueva fecha de expiración (añadir 3 meses)
        const newExpirationDate = new Date(currentContract.fecha_expiracion);
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 3);

        // Actualizar la fecha de expiración del contrato
        const { error: updateError } = await supabaseAdmin
            .from('contratos')
            .update({ fecha_expiracion: newExpirationDate.toISOString() })
            .eq('id', currentContract.id);

        if (updateError) throw updateError;

        res.json({ message: 'Contrato renovado correctamente.', newExpirationDate: newExpirationDate.toLocaleDateString() });

    } catch (error) {
        console.error('Error al renovar contrato:', error);
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// ==========================================================
// 6. RESETEAR CONTRASEÑA (FORZAR ACTUALIZACIÓN)
// ==========================================================
router.post('/reset-password', async (req, res) => {
    const { userUuid } = req.body;

    if (!userUuid) {
        return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
    }

    const newTemporaryPassword = generateTemporaryPassword();

    try {
        const newPasswordHash = await bcrypt.hash(newTemporaryPassword, 10);

        // Actualizar la contraseña y el estado del usuario a temporal
        const { error } = await supabaseAdmin
            .from('usuarios')
            .update({ 
                password_hash: newPasswordHash, 
                status: 'temporary',
                actualizado_at: new Date()
            })
            .eq('uuid', userUuid);

        if (error) throw error;

        res.json({
            message: 'Contraseña reseteada. Usuario ahora es temporal.',
            newTemporaryPassword: newTemporaryPassword
        });

    } catch (error) {
        console.error('Error al resetear contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// ==========================================================
// 7. OBTENER ESTADÍSTICAS DE REGISTRO
// ==========================================================
router.get('/registration-stats', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.rpc('get_registration_stats');

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener estadísticas de registro:', error);
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

module.exports = router;