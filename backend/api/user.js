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

    const { data: userProfile, error } = await supabaseAdmin
      .from('vw_usuarios_planes')
      .select('*')
      .eq('usuario_uuid', userUuid)
      .single();

    if (error || !userProfile) {
      console.error(
        '[GET /profile] Error fetching user profile from view:',
        error
      );
      return res
        .status(404)
        .json({ error: 'Perfil de usuario no encontrado.' });
    }

    console.log(
      '[DEBUG PROFILE] responseProfile ->',
      JSON.stringify(userProfile)
    );
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
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    // 1) Resuelve el id numérico del usuario usando la vista que sí funciona.
    const { data: profile, error: userErr } = await supabaseAdmin
      .from('vw_usuarios_planes')
      .select('usuario_id')
      .eq('usuario_uuid', userUuid)
      .single();

    if (userErr || !profile) {
      console.error('Error buscando usuario por uuid en la vista:', userErr);
      return res.status(500).json({ error: 'No se pudo resolver el usuario.' });
    }
    const usuarioId = profile.usuario_id;

    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select(
        'id, nombre, descripcion, usuario_id, logo_url, activa, created_at, slug'
      )
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('Error al obtener stores:', error);
      return res
        .status(500)
        .json({ error: 'No se pudieron obtener las tiendas.' });
    }

    return res.json(stores || []);
  } catch (err) {
    console.error('Error en GET /stores:', err);
    return res.status(500).json({ error: 'Ocurrió un error inesperado.' });
  }
});

// POST /api/user/stores (Refactorizado para consistencia y corrección de bug)
router.post('/stores', async (req, res) => {
  try {
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const { storeData } = req.body;
    if (!storeData || !storeData.store) {
      return res.status(400).json({ error: 'Payload de tienda inválido.' });
    }

    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('uuid', userUuid)
      .single();

    if (userErr || !userRec) {
      return res.status(500).json({ error: 'No se pudo resolver el usuario.' });
    }
    const usuarioId = userRec.id;

    // Limpiar y preparar el payload principal
    const cleanedData = cleanStoreDataUrls(storeData);

    const { data: created, error } = await supabaseAdmin
      .from('stores')
      .insert({
        usuario_id: usuarioId,
        nombre: cleanedData.store.nombre, // Extraer nombre para la columna principal
        descripcion: cleanedData.store.descripcion, // Extraer descripción
        data: cleanedData, // Guardar el objeto completo en la columna JSONB
        activa: false, // Las tiendas nuevas empiezan inactivas por defecto
      })
      .select('slug, data')
      .single();

    if (error) {
      console.error('Error creando tienda:', error);
      return res.status(500).json({ error: 'No se pudo crear la tienda.' });
    }

    const slug = created.slug;
    const frontendUrl = process.env.FRONTEND_URL || '';
    const shareableUrl = slug ? `${frontendUrl}/store/${slug}` : null;

    return res.status(201).json({
      message: 'Tienda creada con éxito.',
      data: [created], // Envolver en array para consistencia
      shareableUrl,
    });
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

    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('uuid', userUuid)
      .single(); // CORREGIDO DE VUELTA A 'uuid'
    if (userErr || !userRec)
      return res.status(500).json({ error: 'Error al verificar usuario.' });
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
    const {
      customer_name,
      order_date,
      products,
      total_price,
      total_weight,
      raw_message,
    } = req.body;

    if (!customer_name || !order_date || !products || !raw_message) {
      return res
        .status(400)
        .json({ error: 'Faltan datos requeridos para guardar el pedido.' });
    }

    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert([
        {
          user_id: userUuid,
          customer_name,
          order_date,
          products,
          total_price,
          total_weight,
          raw_message,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error al guardar el pedido:', error);
    res
      .status(500)
      .json({ error: 'Error interno del servidor al guardar el pedido.' });
  }
});

// ==========================================================
// 4. OBTENER Y ACTUALIZAR DATOS JSON DE LA TIENDA
// ==========================================================

// GET /api/user/store-data
router.get('/store-data', async (req, res) => {
  console.log('--- [DEBUG /store-data] Endpoint INVOCADO ---');
  try {
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) {
      console.log('[DEBUG /store-data] Fallo: No hay userUuid en el token.');
      return res.status(401).json({ error: 'No autenticado.' });
    }
    console.log(`[DEBUG /store-data] Buscando perfil para UUID: ${userUuid}`);

    const { data: userProfile, error: userErr } = await supabaseAdmin
      .from('vw_usuarios_planes')
      .select('usuario_id, plan')
      .eq('usuario_uuid', userUuid)
      .single();

    console.log('[DEBUG /store-data] Resultado de búsqueda de perfil:', {
      userProfile,
      userErr,
    });

    if (userErr || !userProfile) {
      console.log(
        '[DEBUG /store-data] Fallo: Error de perfil o no se encontró perfil.'
      );
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const usuarioId = userProfile.usuario_id;
    console.log(`[DEBUG /store-data] ID de usuario resuelto: ${usuarioId}`);

    let storeQuery = supabaseAdmin.from('stores').select('data, slug');
    storeQuery = storeQuery.eq('usuario_id', usuarioId).limit(1);

    console.log('[DEBUG /store-data] Ejecutando consulta de tienda...');
    const { data: stores, error: storeError } = await storeQuery;
    console.log('[DEBUG /store-data] Resultado de consulta de tienda:', {
      stores,
      storeError,
    });

    if (storeError) {
      console.log('[DEBUG /store-data] Fallo: Error en la consulta de tienda.');
      return res
        .status(500)
        .json({ error: 'No se pudieron obtener los datos de la tienda.' });
    }

    const store = stores && stores.length > 0 ? stores[0] : null;
    console.log('[DEBUG /store-data] Tienda encontrada:', !!store);

    const slug = store ? store.slug : null;
    const frontendUrl = process.env.FRONTEND_URL || ''; // Fallback a ruta relativa
    const shareableUrl = slug ? `${frontendUrl}/store/${slug}` : null;

    res.json({
      storeData: store ? store.data : {},
      plan: userProfile.plan,
      slug: slug,
      shareableUrl: shareableUrl,
    });
  } catch (err) {
    console.error('Error fatal en GET /store-data:', err);
    res.status(500).json({ error: 'Ocurrió un error inesperado.' });
  }
});

const BUCKET_NAME = process.env.STORAGE_BUCKET || 'imagenes';
const STORAGE_URL_PART = `/storage/v1/object/public/${BUCKET_NAME}/`;

function normalizeSupabaseUrl(url) {
  if (typeof url !== 'string') return url;
  const urlIndex = url.indexOf(STORAGE_URL_PART);
  if (urlIndex > -1) {
    return url.substring(urlIndex + STORAGE_URL_PART.length);
  }
  return url;
}

function cleanStoreDataUrls(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => cleanStoreDataUrls(item));
  }

  return Object.keys(data).reduce((acc, key) => {
    const value = data[key];
    if (typeof value === 'string' && (key.endsWith('Url') || key.endsWith('_url'))) {
      acc[key] = normalizeSupabaseUrl(value);
    } else {
      acc[key] = cleanStoreDataUrls(value); // Recurse on nested objects
    }
    return acc;
  }, {});
}


// PUT /api/user/store-data
router.put('/store-data', async (req, res) => {
  try {
    const { storeData: newStoreData, launch } = req.body;
    if (!newStoreData || typeof newStoreData !== 'object') {
      return res
        .status(400)
        .json({ error: 'Payload de tienda inválido o ausente.' });
    }

    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('uuid', userUuid)
      .single();

    if (userErr || !userRec) {
      return res.status(401).json({ error: 'Usuario de sesión no válido.' });
    }
    const usuarioId = userRec.id;

    const cleanedData = cleanStoreDataUrls(newStoreData);

    const updatePayload = { data: cleanedData };
    if (launch === true) {
      updatePayload.activa = true;
    }

    const { data, error } = await supabaseAdmin
      .from('stores')
      .update(updatePayload)
      .eq('usuario_id', usuarioId)
      .select('slug, data'); // Pedir el slug y la data de vuelta

    if (error) {
      return res
        .status(500)
        .json({ error: 'Error de base de datos al actualizar la tienda.' });
    }

    // Construir la URL compartible con los datos de respuesta
    const slug = data && data.length > 0 ? data[0].slug : null;
    const frontendUrl = process.env.FRONTEND_URL || '';
    const shareableUrl = slug ? `${frontendUrl}/store/${slug}` : null;

    return res.json({
      message: 'Datos de la tienda actualizados con éxito.',
      data,
      shareableUrl, // Devolver la URL al frontend
    });
  } catch (err) {
    console.error('[ERROR GENERAL PUT /store-data]', err.stack || err);
    return res
      .status(500)
      .json({ error: 'Error interno fatal en el servidor.' });
  }
});

module.exports = router;
