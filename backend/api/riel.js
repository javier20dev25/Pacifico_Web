// backend/api/riel.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../services/supabase');

// --- Helper: Generador de slug a partir de un nombre ---
function nombreToSlug(nombre) {
  if (!nombre) return 'tienda';
  return nombre
    .toLowerCase()
    .replace(/\s+/g, '-') // reemplazar espacios con guiones
    .replace(/[^a-z0-9-]/g, '') // quitar caracteres no alfanuméricos (excepto guiones)
    .replace(/--+/g, '-') // reemplazar múltiples guiones con uno solo
    .replace(/^-+|-+$/g, ''); // quitar guiones al inicio y al final
}

// ==========================================================
// ENDPOINT 1: PRE-REGISTRO DE RIEL
// ==========================================================
router.post('/preregister', async (req, res) => {
  const { whatsapp_number } = req.body;

  if (!whatsapp_number || !/^\+?[1-9]\d{1,14}$/.test(whatsapp_number)) {
    return res.status(400).json({ error: 'Se requiere un número de WhatsApp válido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('riel_preregistrations')
      .upsert({ 
        whatsapp_number: whatsapp_number,
        status: 'pending',
       }, {
        onConflict: 'whatsapp_number',
      })
      .select('identifier')
      .single();

    if (error) throw error;

    if (!data || !data.identifier) {
        const { data: selectData, error: selectError } = await supabaseAdmin
            .from('riel_preregistrations')
            .select('identifier')
            .eq('whatsapp_number', whatsapp_number)
            .single();
        
        if(selectError || !selectData) {
             throw new Error("No se pudo crear o recuperar el identificador de pre-registro.");
        }
        return res.status(201).json({ identifier: selectData.identifier });
    }

    res.status(201).json({ identifier: data.identifier });

  } catch (error) {
    console.error('[FATAL] /api/riel/preregister:', error.message);
    res.status(500).json({ error: 'Ocurrió un error en el servidor durante el pre-registro.' });
  }
});

// ==========================================================
// ENDPOINT 2: VERIFICAR TOKEN DE ACTIVACIÓN DE RIEL
// ==========================================================
router.get('/verify-token', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ error: 'Falta el token de activación.' });
    }

    try {
        const { data: user, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('uuid, activation_token_expires_at')
            .eq('activation_token', token)
            .eq('status', 'temporary')
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'Token inválido o ya utilizado.' });
        }

        if (new Date(user.activation_token_expires_at) < new Date()) {
            return res.status(410).json({ error: 'El enlace de activación ha expirado.' });
        }

        const { data: preReg, error: preRegError } = await supabaseAdmin
            .from('riel_preregistrations')
            .select('whatsapp_number')
            .eq('user_uuid', user.uuid)
            .single();

        if (preRegError || !preReg) {
            return res.status(404).json({ error: 'No se pudo encontrar el pre-registro asociado.' });
        }

        res.status(200).json({ whatsapp_number: preReg.whatsapp_number });

    } catch (error) {
        console.error('[FATAL] /api/riel/verify-token:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// ==========================================================
// ENDPOINT 3: COMPLETAR ACTIVACIÓN DE RIEL (CORREGIDO)
// ==========================================================
router.post('/complete-activation', async (req, res) => {
    const { token, whatsapp_number } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Falta el token de activación.' });
    }

    try {
        const { data: user, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('uuid, nombre, correo, role')
            .eq('activation_token', token)
            .eq('status', 'temporary')
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'Token inválido o ya utilizado.' });
        }
        
        const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('usuarios')
            .update({
                status: 'active',
                temporary_password: null,
                activation_token: null,
                activation_token_expires_at: null,
                actualizado_at: new Date(),
            })
            .eq('uuid', user.uuid)
            .select('id')
            .single();

        if (updateError) throw new Error('Error al activar el perfil de usuario.');

        // La tienda ya fue creada en el paso del admin, aquí solo activamos al usuario.
        // No es necesario crear la tienda de nuevo.

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error("JWT_SECRET no está configurado en el servidor.");

        const sessionToken = jwt.sign(
            { uuid: user.uuid, rol: user.role, email: user.correo },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: '¡Cuenta activada con éxito!',
            sessionToken,
            user: {
                nombre: user.nombre,
                rol: user.role,
            }
        });

    } catch (error) {
        console.error('[FATAL] /api/riel/complete-activation:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al completar la activación.' });
    }
});


module.exports = router;