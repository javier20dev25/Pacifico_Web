// backend/api/riel.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

function nombreToSlug(nombre) {
  if (!nombre) return 'tienda';
  return nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
}

router.post('/preregister', async (req, res, next) => {
  const { whatsapp_number, name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Se requiere un nombre.' });
  }
  if (!whatsapp_number || whatsapp_number.length < 8) {
    return res.status(400).json({ error: 'Se requiere un número de WhatsApp válido.' });
  }
  try {
    const { data, error } = await supabaseAdmin.from('riel_preregistrations').upsert({
      whatsapp_number: whatsapp_number,
      name: name.trim(),
      status: 'pending',
    }, { onConflict: 'whatsapp_number' }).select('identifier').single();
    if (error) throw error;
    if (!data || !data.identifier) {
      const { data: selectData, error: selectError } = await supabaseAdmin.from('riel_preregistrations').select('identifier').eq('whatsapp_number', whatsapp_number).single();
      if (selectError || !selectData) throw new Error("No se pudo crear o recuperar el identificador de pre-registro después del fallback.");
      return res.status(201).json({ identifier: selectData.identifier });
    }
    res.status(201).json({ identifier: data.identifier });
  } catch (error) {
    console.error('[FATAL] /api/riel/preregister:', error.message);
    next(error);
  }
});

router.get('/verify-token', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Falta el token de activación.' });
    try {
        const { data: user, error: userError } = await supabaseAdmin.from('usuarios').select('uuid, nombre, activation_token_expires_at').eq('activation_token', token).single();
        if (userError || !user) return res.status(404).json({ error: 'Token inválido o ya utilizado.' });
        if (new Date(user.activation_token_expires_at) < new Date()) return res.status(410).json({ error: 'El enlace de activación ha expirado.' });
        
        // CORRECCIÓN: BUSCAR WHATSAPP Y DEVOLVERLO
        const { data: preReg, error: preRegError } = await supabaseAdmin.from('riel_preregistrations').select('whatsapp_number').eq('user_uuid', user.uuid).single();
        const whatsappNumber = preReg ? preReg.whatsapp_number : '';

        res.status(200).json({ 
            name: user.nombre, 
            whatsapp_number: whatsappNumber 
        });
    } catch (error) {
        console.error('[FATAL] /api/riel/verify-token:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

router.post('/complete-activation', async (req, res) => {
    const { token, whatsapp_number, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Faltan el token o la contraseña.' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    try {
        const { data: user, error: userError } = await supabaseAdmin.from('usuarios').select('uuid, nombre, correo, role').eq('activation_token', token).single();
        if (userError || !user) return res.status(404).json({ error: 'Token inválido o ya utilizado.' });
        
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.uuid, { password: password });
        if (authUpdateError) throw new Error(`Error al actualizar contraseña en Auth: ${authUpdateError.message}`);

        await supabaseAdmin.from('usuarios').update({
            status: 'active',
            temporary_password: null,
            activation_token: null,
            activation_token_expires_at: null,
            actualizado_at: new Date(),
        }).eq('uuid', user.uuid);

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error("JWT_SECRET no está configurado en el servidor.");

        const sessionToken = jwt.sign(
            { uuid: user.uuid, rol: user.role, email: user.correo },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: '¡Cuenta activada con éxito!',
            sessionToken,
            user: { nombre: user.nombre, rol: user.role }
        });
    } catch (error) {
        console.error('[FATAL] /api/riel/complete-activation:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al completar la activación.' });
    }
});

// ANALYTICS ENDPOINTS
router.post('/visits', async (req, res) => {
    const { store_id, session_id } = req.body;
    if (!store_id || !session_id) return res.status(400).json({ error: 'Faltan datos para registrar la visita.' });
    try {
        await supabaseAdmin.from('store_visits').insert({ store_id, session_id });
        res.status(201).send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/interactions', async (req, res) => {
    const { store_id, product_id_local, interaction_type, session_id } = req.body;
    if (!store_id || !product_id_local || !interaction_type || !session_id) return res.status(400).json({ error: 'Faltan datos para registrar la interacción.' });
    const validTypes = ['like', 'nope', 'add_to_cart'];
    if (!validTypes.includes(interaction_type)) return res.status(400).json({ error: 'Tipo de interacción no válido.' });
    try {
        await supabaseAdmin.from('product_interactions').insert({ store_id, product_id_local, interaction_type, session_id });
        res.status(201).send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/analytics', protect, async (req, res) => {
    const userUuid = req.user.uuid;
    try {
        // Paso 1: Obtener el ID numérico del usuario desde el UUID.
        const { data: userData, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('uuid', userUuid)
            .single();

        if (userError || !userData) {
            console.error(`[Analytics] Usuario no encontrado por UUID: ${userUuid}`, userError);
            return res.status(404).json({ error: 'No se pudo verificar el usuario para las analíticas.' });
        }
        const usuarioId = userData.id;

        // Paso 2: Usar el ID numérico para encontrar la tienda.
        const { data: storeData, error: storeError } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('usuario_id', usuarioId)
            .single();

        if (storeError || !storeData) {
            console.error(`[Analytics] Tienda no encontrada para usuario ID: ${usuarioId}`, storeError);
            return res.status(404).json({ error: 'No se encontró una tienda para este usuario.' });
        }
        const store_id = storeData.id;
        
        // El resto de la lógica es la misma que ya estaba...
        // INICIO: Modificación para visitas mensuales
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { count: visitCount, error: visitError } = await supabaseAdmin
            .from('store_visits')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store_id)
            .gte('created_at', startDate.toISOString())
            .lt('created_at', endDate.toISOString());
        // FIN: Modificación para visitas mensuales

        if (visitError) throw visitError;

        const { data: interactions, error: interactionError } = await supabaseAdmin.from('product_interactions').select('product_id_local, interaction_type').eq('store_id', store_id);
        if (interactionError) throw interactionError;

        const stats = { total_visits: visitCount || 0, likes: {}, nopes: {}, added_to_cart: {} };
        for (const interaction of interactions) {
            const { product_id_local, interaction_type } = interaction;
            if (interaction_type === 'like') stats.likes[product_id_local] = (stats.likes[product_id_local] || 0) + 1;
            else if (interaction_type === 'nope') stats.nopes[product_id_local] = (stats.nopes[product_id_local] || 0) + 1;
            else if (interaction_type === 'add_to_cart') stats.added_to_cart[product_id_local] = (stats.added_to_cart[product_id_local] || 0) + 1;
        }
        res.json(stats);
    } catch (error) {
        console.error('[FATAL] /api/riel/analytics:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener las analíticas.' });
    }
});

module.exports = router;
