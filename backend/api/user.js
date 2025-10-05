const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

// ==========================================================
// 1. OBTENER PERFIL DE USUARIO
// ==========================================================
router.get('/profile', protect, async (req, res) => {
    try {
        const userUuid = req.user.uuid; 

        const { data: userProfile, error } = await supabaseAdmin
            .from('vw_usuarios_planes')
            .select('*')
            .eq('usuario_uuid', userUuid)
            .single();

        console.log('[DEBUG PROFILE RAW] ->', JSON.stringify(userProfile));

        if (error || !userProfile) {
            return res.status(404).json({ error: 'Perfil de usuario no encontrado.' });
        }

        // Mapear campos para asegurar compatibilidad con el frontend
        const responseProfile = {
    ...userProfile,
    plan: userProfile.plan ?? userProfile.plan_nombre ?? null
  };

  console.log('[DEBUG PROFILE] responseProfile ->', JSON.stringify(responseProfile));
        res.json({ user: responseProfile }); // Anidar la respuesta bajo la clave 'user'

    } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ==========================================================
// 2. OBTENER Y CREAR TIENDAS DEL USUARIO
// ==========================================================

// GET /api/user/stores
router.get('/stores', async (req, res) => {
  try {
    // Obtén la uuid del usuario del token (establecido por el middleware protect)
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    // 1) Resuelve el id numérico del usuario a partir de su uuid
    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('uuid', userUuid)
      .single();

    if (userErr) {
      console.error('Error buscando usuario por uuid:', userErr);
      return res.status(500).json({ error: 'No se pudo resolver el usuario.' });
    }
    const usuarioId = userRec.id;

    // 2) Consulta tiendas por usuario_id (bigint)
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      // selecciona los campos que necesites mostrar al frontend
      .select('id, nombre, descripcion, usuario_id, logo_url, activa, created_at')
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('Error al obtener stores:', error);
      return res.status(500).json({ error: 'No se pudieron obtener las tiendas.' });
    }

    return res.json(stores || []);
  } catch (err) {
    console.error('Error en GET /stores:', err);
    return res.status(500).json({ error: 'Ocurrió un error inesperado.' });
  }
});

// POST /api/user/stores
router.post('/stores', async (req, res) => {
  try {
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const { nombre, descripcion, logo_url, direccion, telefono } = req.body;

    // Resuelve usuario_id desde uuid
    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('uuid', userUuid)
      .single();

    if (userErr) {
      console.error('Error buscando usuario por uuid (POST /stores):', userErr);
      return res.status(500).json({ error: 'No se pudo resolver el usuario.' });
    }
    const usuarioId = userRec.id;

    // Inserta la tienda con usuario_id (bigint)
    const { data: created, error } = await supabaseAdmin
      .from('stores')
      .insert({
        usuario_id: usuarioId,
        nombre: nombre || 'Mi Tienda',
        descripcion: descripcion || '',
        logo_url: logo_url || null,
        direccion: direccion || null,
        telefono: telefono || null,
        activa: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando tienda:', error);
      return res.status(500).json({ error: 'No se pudo crear la tienda.' });
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error('Error en POST /stores:', err);
    return res.status(500).json({ error: 'Ocurrió un error inesperado.' });
  }
});

// ==========================================================
// 3. GUARDAR UN NUEVO PEDIDO
// ==========================================================
router.post('/orders', protect, async (req, res) => {
    try {
        const userUuid = req.user.uuid;
        const { customer_name, order_date, products, total_price, total_weight, raw_message } = req.body;

        // Validación básica
        if (!customer_name || !order_date || !products || !raw_message) {
            return res.status(400).json({ error: 'Faltan datos requeridos para guardar el pedido.' });
        }

        const { data, error } = await supabaseAdmin
            .from('pedidos') // Usando la tabla 'pedidos' que definimos
            .insert([{
                user_id: userUuid,
                customer_name,
                order_date,
                products,
                total_price,
                total_weight,
                raw_message
            }])
            .select();

        if (error) { throw error; }

        res.status(201).json(data);

    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor al guardar el pedido.' });
    }
});


module.exports = router;