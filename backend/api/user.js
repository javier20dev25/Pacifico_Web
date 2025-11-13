const express = require('express');

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

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const storesWithUrls = stores.map((store) => ({
      ...store,
      shareableUrl: store.slug ? `${backendUrl}/store/${store.slug}` : null,
    }));

    return res.json(storesWithUrls || []);
  } catch (err) {
    console.error('Error en GET /stores:', err);
    return res.status(500).json({ error: 'Ocurrió un error inesperado.' });
  }
});

// POST /api/user/stores (Refactorizado con lógica UPSERT para evitar errores de duplicados)
router.post('/stores', async (req, res) => {
  try {
    const userUuid = req.user && (req.user.uuid || req.user.user_uuid);
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const { storeData } = req.body;
    if (!storeData || !storeData.store) {
      return res.status(400).json({ error: 'Payload de tienda inválido.' });
    }

    // 1. Resolver el ID de usuario
    const { data: userRec, error: userErr } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('uuid', userUuid)
      .single();

    if (userErr || !userRec) {
      return res.status(500).json({ error: 'No se pudo resolver el usuario.' });
    }
    const usuarioId = userRec.id;

    // 2. Limpiar y preparar el payload
    const cleanedData = cleanStoreDataUrls(storeData);
    const payload = {
      usuario_id: usuarioId,
      nombre: cleanedData.store.nombre,
      descripcion: cleanedData.store.descripcion,
      data: cleanedData,
    };

    // 3. Lógica de UPSERT: Buscar primero, luego decidir si crear o actualizar
    const { data: existingStore, error: findError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('usuario_id', usuarioId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = 'exact one row not found'
      console.error('Error buscando tienda existente:', findError);
      return res.status(500).json({ error: 'Error al verificar la tienda.' });
    }

    let finalResult;
    let statusCode = 200;
    let message = '';

    if (existingStore) {
      // --- ACTUALIZAR ---
      const { data, error } = await supabaseAdmin
        .from('stores')
        .update(payload)
        .eq('id', existingStore.id)
        .select('slug, data')
        .single();

      if (error) throw error;
      finalResult = data;
      message = 'Tienda actualizada con éxito.';
    } else {
      // --- CREAR ---
      const { data, error } = await supabaseAdmin
        .from('stores')
        .insert({ ...payload, activa: false }) // Las nuevas tiendas empiezan inactivas
        .select('slug, data')
        .single();

      if (error) throw error;
      finalResult = data;
      statusCode = 201;
      message = 'Tienda creada con éxito.';
    }

    const slug = finalResult.slug;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const shareableUrl = slug ? `${backendUrl}/store/${slug}` : null;

    return res.status(statusCode).json({
      message,
      data: [finalResult], // Envolver en array para consistencia
      shareableUrl,
    });
  } catch (err) {
    console.error('Error en POST /stores (UPSERT):', err);
    return res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado al guardar la tienda.' });
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
      cliente_nombre,
      order_date,
      products,
      total_price,
      total_weight,
      raw_message,
    } = req.body;

    if (!cliente_nombre || !order_date || !products || !raw_message) {
      return res
        .status(400)
        .json({ error: 'Faltan datos requeridos para guardar el pedido.' });
    }

    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert([
        {
          user_id: userUuid,
          cliente_nombre,
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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const shareableUrl = slug ? `${backendUrl}/store/${slug}` : null;

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
    return data.map((item) => cleanStoreDataUrls(item));
  }

  return Object.keys(data).reduce((acc, key) => {
    const value = data[key];
    if (
      typeof value === 'string' &&
      (key.endsWith('Url') || key.endsWith('_url'))
    ) {
      acc[key] = normalizeSupabaseUrl(value);
    } else {
      acc[key] = cleanStoreDataUrls(value); // Recurse on nested objects
    }
    return acc;
  }, {});
}

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB limit

// PUT /api/user/store-data (Refactorizado con lógica UPSERT)
router.put(
  '/store-data',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'products', maxCount: 70 },
  ]),
  async (req, res) => {
    try {
      const userUuid = req.user?.uuid;
      if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

      const newStoreData = req.body.storeData
        ? JSON.parse(req.body.storeData)
        : {};
      const launch = req.body.launch === 'true';

      if (typeof newStoreData !== 'object' || newStoreData === null) {
        return res.status(400).json({ error: 'Payload de tienda inválido.' });
      }

      const { data: userRec, error: userErr } = await supabaseAdmin
        .from('usuarios')
        .select('id, nombre')
        .eq('uuid', userUuid)
        .single();

      if (userErr || !userRec) {
        return res.status(401).json({ error: 'Usuario de sesión no válido.' });
      }
      const usuarioId = userRec.id;

      let cleanedData = newStoreData;

      // --- Lógica de Subida de Archivos (si los hay) ---
      if (req.files && req.files.logo) {
        const logoFile = req.files.logo[0];
        const fileExt = logoFile.originalname.split('.').pop();
        const filePath = `${userUuid}/logo_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_NAME) // CORREGIDO: Usar bucket de variable de entorno
          .upload(filePath, logoFile.buffer, {
            contentType: logoFile.mimetype,
            upsert: true,
          });

        if (uploadError) {
            console.error('Error subiendo logo:', uploadError);
            throw new Error(`Error subiendo el logo: ${uploadError.message}`);
        }

        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET_NAME) // CORREGIDO: Usar bucket de variable de entorno
          .getPublicUrl(filePath);
        cleanedData.store.logoUrl = urlData.publicUrl;
      }
      
      if (req.files && req.files.products) {
        for (const productFile of req.files.products) {
          const idLocal = productFile.originalname;
          const productIndex = cleanedData.products.findIndex(p => p.idLocal === idLocal);

          if (productIndex > -1) {
            const fileExt = productFile.mimetype.split('/')[1];
            const filePath = `${userUuid}/product_${idLocal}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabaseAdmin.storage
              .from(BUCKET_NAME) // CORREGIDO: Usar bucket de variable de entorno
              .upload(filePath, productFile.buffer, {
                contentType: productFile.mimetype,
                upsert: true,
              });

            if (uploadError) {
              console.error(`Error subiendo imagen para producto ${idLocal}:`, uploadError);
              continue; 
            }

            const { data: urlData } = supabaseAdmin.storage
              .from(BUCKET_NAME) // CORREGIDO: Usar bucket de variable de entorno
              .getPublicUrl(filePath);
            
            cleanedData.products[productIndex].imageUrl = urlData.publicUrl;
          }
        }
      }

      // --- Lógica UPSERT ---
      const { data: existingStore } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('usuario_id', usuarioId)
        .single();

      let finalResult;
      let statusCode;
      let message;

      // CORREGIDO: Construir el payload plano para la BD
      const payload = {
        usuario_id: usuarioId,
        nombre: cleanedData.store?.nombre || userRec.nombre,
        descripcion: cleanedData.store?.descripcion,
        logo_url: cleanedData.store?.logoUrl,
        products: cleanedData.products || [],
        activa: launch,
        slug: null, // CORREGIDO: Forzar la regeneración del slug
        data: cleanedData,
      };

      if (existingStore) {
        // --- ACTUALIZAR ---
        const { data, error } = await supabaseAdmin
          .from('stores')
          .update(payload)
          .eq('id', existingStore.id)
          .select('slug, data')
          .single();

        if (error) throw error;
        finalResult = data;
        statusCode = 200;
        message = 'Tienda actualizada con éxito.';
      } else {
        // --- CREAR ---
        const { data, error } = await supabaseAdmin
          .from('stores')
          .insert(payload)
          .select('slug, data')
          .single();

        if (error) throw error;
        finalResult = data;
        statusCode = 201;
        message = '¡Tienda lanzada con éxito!';
      }

      const slug = finalResult.slug;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const shareableUrl = slug ? `${backendUrl}/store/${slug}` : null;

      // CORREGIDO: Devolver una estructura consistente y limpia
      return res.status(statusCode).json({
        message,
        storeData: finalResult.data,
        slug: finalResult.slug,
        shareableUrl,
      });
    } catch (err) {
      console.error('[ERROR GENERAL PUT /store-data]', err.stack || err);
      return res
        .status(500)
        .json({ error: 'Error interno fatal en el servidor.' });
    }
  }
);

module.exports = router;
