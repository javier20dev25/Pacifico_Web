const express = require('express');
const util = require('util');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

// ==========================================================
// 1. OBTENER PERFIL DE USUARIO
// ==========================================================
router.get('/profile', protect, async (req, res) => {
    console.log('[DEBUG] Entrando a /api/user/profile, req.user =', req.user);
    try {
        const userUuid = req.user.uuid; 

        // Usar la vista vw_usuarios_planes para obtener un perfil completo y consistente
        const { data: userProfile, error } = await supabaseAdmin
            .from('vw_usuarios_planes')
            .select('*')
            .eq('usuario_uuid', userUuid)
            .single();

        if (error || !userProfile) {
            console.error('[GET /profile] Error fetching user profile from view:', error);
            return res.status(404).json({ error: 'Perfil de usuario no encontrado.' });
        }

        console.log('[DEBUG PROFILE] responseProfile ->', JSON.stringify(userProfile));
        res.json({ user: userProfile });

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
      .select('id, nombre, descripcion, usuario_id, logo_url, activa, created_at, slug')
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

// DELETE /api/user/stores/:id
router.delete('/stores/:id', async (req, res) => {
  try {
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const { id } = req.params;

    // Verificar que la tienda pertenece al usuario antes de borrar
    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios').select('id').eq('uuid', userUuid).single();
    if (userErr) return res.status(500).json({ error: 'Error al verificar usuario.' });
    const usuarioId = userRec.id;

    const { error } = await supabaseAdmin
      .from('stores')
      .delete()
      .match({ id: id, usuario_id: usuarioId });

    if (error) {
      console.error('Error al eliminar la tienda:', error);
      return res.status(500).json({ error: 'No se pudo eliminar la tienda.' });
    }

    res.status(200).json({ message: 'Tienda eliminada correctamente.' });

  } catch (err) {
    console.error('Error en DELETE /stores/:id:', err);
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



// ==========================================================
// 4. OBTENER Y ACTUALIZAR DATOS JSON DE LA TIENDA
// ==========================================================

// GET /api/user/store-data
router.get('/store-data', async (req, res) => {
    try {
        const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
        if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

        const { slug } = req.query; // Leer el slug de la query

        // 1. Obtener el plan del usuario
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('vw_usuarios_planes')
            .select('plan')
            .eq('usuario_uuid', userUuid)
            .single();

        if (profileError || !profileData) {
            return res.status(404).json({ error: 'No se pudo determinar el plan del usuario.' });
        }

        // 2. Obtener los datos de la tienda
        let storeQuery = supabaseAdmin.from('stores').select('data, slug');
        const { data: userRec } = await supabaseAdmin.from('usuarios').select('id').eq('uuid', userUuid).single();
        if (!userRec) return res.status(404).json({ error: 'Usuario no encontrado.' });

        if (slug) {
            // Si se provee un slug, buscar esa tienda específica
            storeQuery = storeQuery.eq('slug', slug).eq('usuario_id', userRec.id);
        } else {
            // Comportamiento original: buscar la primera tienda del usuario
            storeQuery = storeQuery.eq('usuario_id', userRec.id).limit(1);
        }

        const { data: store, error: storeError } = await storeQuery.single();

        if (storeError && storeError.code !== 'PGRST116') { // PGRST116 = 0 filas, lo cual es ok
            console.error('Error al obtener datos de la tienda:', storeError);
            return res.status(500).json({ error: 'No se pudieron obtener los datos de la tienda.' });
        }

        // 3. Devolver datos de la tienda y el plan
        res.json({
            storeData: store ? store.data : {},
            plan: profileData.plan,
            slug: store ? store.slug : null
        });

    } catch (err) {
        console.error('Error en GET /store-data:', err);
        res.status(500).json({ error: 'Ocurrió un error inesperado.' });
    }
});

// PUT /api/user/store-data (Versión de Depuración Avanzada)
router.put('/store-data', async (req, res) => {
  console.log('\n--- [PUT /store-data] Petición Recibida ---');
  console.log('[PUT /store-data] headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': !!req.headers['authorization']
  });

  try {
    const newStoreData = req.body;
    console.log('[DEBUG] Intentando guardar - preview:', util.inspect(newStoreData, { depth: 2, colors: true }));

    if (!newStoreData || typeof newStoreData !== 'object') {
      console.warn('[PUT /store-data] payload inválido o vacío');
      return res.status(400).json({ error: 'Payload inválido o ausente.' });
    }

    if (JSON.stringify(newStoreData).includes('blob:')) {
      console.warn('[PUT /store-data] Alerta: El payload contiene URLs de tipo \"blob:\". Estas son referencias locales del navegador y no se pueden guardar. Deberían ser eliminadas antes de enviar.');
    }

    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const { data: userRec, error: userErr } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('uuid', userUuid)
        .single();

    if (userErr || !userRec) {
        console.error('[PUT /store-data] Usuario no encontrado o error:', userErr);
        return res.status(401).json({ error: 'Usuario de sesión no válido.' });
    }
    const usuarioId = userRec.id;

    console.log(`[PUT /store-data] Actualizando tienda para usuario_id: ${usuarioId}`);

    const { data, error } = await supabaseAdmin
        .from('stores')
        .update({ data: newStoreData })
        .eq('usuario_id', usuarioId)
        .select();

    console.log('[PUT /store-data] Respuesta de Supabase (data):', util.inspect(data, { depth: 2, colors: true }));
    console.log('[PUT /store-data] Respuesta de Supabase (error):', util.inspect(error, { depth: 2, colors: true }));

    if (error) {
      console.error('[PUT /store-data] Error final al actualizar:', error);
      return res.status(500).json({ error: 'Error de base de datos al actualizar la tienda.' });
    }

    return res.json({ message: 'Datos de la tienda actualizados con éxito.', data });

  } catch (err) {
    console.error('[ERROR GENERAL PUT /store-data]', err.stack || err);
    return res.status(500).json({ error: 'Error interno fatal en el servidor.' });
  }
});

module.exports = router;