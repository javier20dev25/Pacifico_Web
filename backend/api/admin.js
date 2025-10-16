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

// --- Helper: Generador de Correo a partir del nombre de la tienda ---
function nombreAToken(nombre) {
  return nombre.toLowerCase()
               .replace(/\s+/g, '')   // quitar espacios
               .replace(/[^a-z0-9]/g,''); // quitar caracteres especiales
}

// ==========================================================
// 1. CREAR USUARIO TEMPORAL
// ==========================================================
router.post('/create-temporary-user', async (req, res) => {
    console.log('[DEBUG] create-temporary-user body ->', req.body);
    try {
        const { nombre, correo: correoEnviado, plan_nombre } = req.body;

        if (!nombre || !plan_nombre) {
            return res.status(400).json({ error: 'Nombre de tienda y plan son obligatorios.' });
        }

        let correoFinal;
        if (correoEnviado && correoEnviado.trim()) {
            correoFinal = correoEnviado.trim();
            const { data: existingUser, error: existingError } = await supabaseAdmin
                .from('usuarios')
                .select('correo')
                .eq('correo', correoFinal)
                .single();

            if (existingUser) {
                return res.status(409).json({ error: 'El correo electrónico proporcionado ya está en uso.' });
            }
            if (existingError && existingError.code !== 'PGRST116') {
                console.error('Supabase error checking correo (admin provided):', existingError);
                return res.status(500).json({ error: 'Ocurrió un error al verificar el correo.' });
            }
        } else {
            let correoBase = nombreAToken(nombre) + '@pacificoweb.com';
            correoFinal = correoBase;
            let suffix = 0;
            while (true) {
                const { data: existingUser, error: existingError } = await supabaseAdmin
                    .from('usuarios')
                    .select('correo')
                    .eq('correo', correoFinal)
                    .single();

                if (existingError && existingError.code !== 'PGRST116') {
                    console.error('Supabase error checking correo (generated):', existingError);
                    return res.status(500).json({ error: 'Ocurrió un error al verificar el correo.' });
                }

                if (existingUser) {
                    suffix++;
                    correoFinal = nombreAToken(nombre) + suffix + '@pacificoweb.com';
                } else {
                    break;
                }
            }
        }

        const temporaryPassword = generateTemporaryPassword();
        const password_hash = await bcrypt.hash(temporaryPassword, 10);

        const { error } = await supabaseAdmin.rpc('create_user_and_contract', {
            p_nombre: nombre,
            p_correo: correoFinal,
            p_password_hash: password_hash,
            p_plan_nombre: plan_nombre
        });

        if (error) {
            console.error('Supabase RPC error (create_user_and_contract):', error);
            if (error.code === '23505') {
                return res.status(409).json({ error: 'El correo electrónico ya está en uso (violación de unicidad).' });
            }
            return res.status(500).json({ error: 'Ocurrió un error al crear el usuario y el contrato.' });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const subject = `🎉 Nuevo Usuario Temporal Creado: ${nombre} (${correoFinal})`;
            const text = `Se ha creado un nuevo usuario temporal:\nNombre: ${nombre}\nCorreo: ${correoFinal}\nPlan: ${plan_nombre}\nContraseña Temporal: ${temporaryPassword}\n\nRecuerda compartirle las credenciales y el enlace de login.`;
            const html = `<p>Se ha creado un nuevo usuario temporal:</p><ul><li><strong>Nombre:</strong> ${nombre}</li><li><strong>Correo:</strong> ${correoFinal}</li><li><strong>Plan:</strong> ${plan_nombre}</li><li><strong>Contraseña Temporal:</strong> <code>${temporaryPassword}</code></li></ul><p>Recuerda compartirle las credenciales y el enlace de login.</p>`;
            sendEmail(adminEmail, subject, text, html);
        }

        res.status(201).json({
            message: 'Usuario temporal y contrato creados con éxito.',
            credentials: {
                correo: correoFinal,
                password: temporaryPassword
            }
        });

    } catch (error) {
        console.error('Error en la transacción de creación de usuario:', error);
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
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
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
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
        const { error } = await supabaseAdmin
            .from('usuarios')
            .delete()
            .eq('uuid', userUuid);

        if (error) throw error;

        res.json({ message: 'Usuario eliminado correctamente.' });

    } catch (error) {
        console.error('Error al revocar usuario:', error);
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
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
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
    }
});

// ==========================================================
// 4.1. REACTIVAR USUARIO
// ==========================================================
router.post('/reactivate-user', async (req, res) => {
    const { userUuid } = req.body;

    if (!userUuid) {
        return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('usuarios')
            .update({ status: 'active', actualizado_at: new Date() })
            .eq('uuid', userUuid);

        if (error) throw error;

        res.json({ message: 'Usuario reactivado correctamente.' });

    } catch (error) {
        console.error('Error al reactivar usuario:', error);
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
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
        const { data: currentContract, error: contractError } = await supabaseAdmin
            .from('contratos')
            .select('id, fecha_expiracion')
            .eq('usuario_uuid', userUuid)
            .eq('activo', true)
            .single();

        if (contractError || !currentContract) {
            return res.status(404).json({ error: 'No se encontró un contrato activo para este usuario.' });
        }

        const newExpirationDate = new Date(currentContract.fecha_expiracion);
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 3);

        const { error: updateError } = await supabaseAdmin
            .from('contratos')
            .update({ fecha_expiracion: newExpirationDate.toISOString() })
            .eq('id', currentContract.id);

        if (updateError) throw updateError;

        res.json({ message: 'Contrato renovado correctamente.', newExpirationDate: newExpirationDate.toLocaleDateString() });

    } catch (error) {
        console.error('Error al renovar contrato:', error);
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
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
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
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
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
    }
});

// ==========================================================
// 8. OBTENER LISTA DE PLANES
// ==========================================================
router.get('/plans', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('planes')
            .select('*');

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener los planes:', error);
        res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
    }
});

module.exports = router;