const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase'); // Usamos el cliente de Supabase para la conexión a la DB
const bcrypt = require('bcryptjs');

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
    const { nombre, correo, plan_nombre } = req.body;

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

module.exports = router;
