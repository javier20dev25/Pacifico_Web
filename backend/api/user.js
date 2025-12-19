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
// 1.5. ACTUALIZAR CONTRASEÑA (PARA CAMBIO FORZADO)
// ==========================================================
// Helper de validación de contraseña (puedes moverlo a un archivo de utils)
function isPasswordStrong(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
}

router.post('/update-password', protect, async (req, res) => {
  const { password } = req.body;
  const userUuid = req.user.uuid;

  if (!password || !isPasswordStrong(password)) {
    return res.status(400).json({
      error:
        'La contraseña es débil. Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.',
    });
  }

  try {
    // 1. Actualizar la contraseña en Supabase Auth
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(userUuid, {
        password: password,
      });

    if (authUpdateError) {
      console.error('Error al actualizar contraseña en Supabase Auth:', authUpdateError);
      throw new Error('No se pudo actualizar la contraseña en el sistema de autenticación.');
    }

    // 2. Actualizar el estado en la tabla de perfiles
    const { error: profileUpdateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        status: 'active',
        temporary_password: null,
        actualizado_at: new Date(),
      })
      .eq('uuid', userUuid);

    if (profileUpdateError) {
      console.error('Error al actualizar el perfil del usuario a activo:', profileUpdateError);
      // En un escenario real, aquí podrías considerar revertir el cambio de contraseña.
      throw new Error('No se pudo actualizar el estado del perfil del usuario.');
    }

    res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error en el proceso de actualización de contraseña:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.', details: error.message });
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
        'id, nombre, descripcion, usuario_id, logo_url, activa, created_at, slug, store_type'
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

    // 2. Preparar el payload (sin limpiar las URLs)
    const payload = {
      usuario_id: usuarioId,
      nombre: storeData.store.nombre,
      descripcion: storeData.store.descripcion,
      data: storeData,
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
      .select('plan, product_limit')
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
    
    // NOTA: El usuario_id ya no es necesario aquí, se obtiene en el endpoint PUT /store-data
    // const usuarioId = userProfile.usuario_id;

    let storeQuery = supabaseAdmin.from('stores').select('data, slug');
    // La consulta de tienda ya no necesita el usuario_id aquí, asumiendo que el RLS (Row Level Security) se encarga de la autorización.
    // Para ser más explícitos y seguros, lo ideal sería resolver el usuario_id de todas formas.
    // Por ahora, el flujo depende de que el GET de /user/store-data y el PUT de /user/store-data se basen en el mismo userUuid del token.
    const { data: userForStore, error: userForStoreErr } = await supabaseAdmin.from('usuarios').select('id').eq('uuid', userUuid).single();
    if(userForStoreErr || !userForStore) return res.status(404).json({error: "Usuario no encontrado para la tienda."});

    storeQuery = storeQuery.eq('usuario_id', userForStore.id).limit(1);

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
      planInfo: userProfile, // <-- CORRECCIÓN: Enviar el objeto completo del plan
      slug: slug,
      shareableUrl: shareableUrl,
    });
  } catch (err) {
    console.error('Error fatal en GET /store-data:', err);
    res.status(500).json({ error: 'Ocurrió un error inesperado.' });
  }
});

// PUT /api/user/store-data (Refactorizado para no usar Multer)
router.put('/store-data', async (req, res) => {
    try {
      const userUuid = req.user?.uuid;
      if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

      // Los datos ahora vienen en el cuerpo como JSON, no como FormData
      const { storeData, launch } = req.body;

      if (typeof storeData !== 'object' || storeData === null || !storeData.store) {
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

      // ==========================================================
      // INICIO: Lógica de Validación de Límite de Productos
      // ==========================================================
      const { data: planInfo, error: planError } = await supabaseAdmin
        .from('vw_usuarios_planes')
        .select('plan, product_limit')
        .eq('usuario_uuid', userUuid)
        .single();

      if (planError || !planInfo) {
        return res.status(500).json({ error: 'No se pudo verificar el plan del usuario.' });
      }

      const productLimit = planInfo.product_limit;
      const incomingProductCount = storeData.products?.length || 0;

      if (incomingProductCount > productLimit) {
        return res.status(403).json({
          error: 'Límite de productos excedido.',
          message: `Tu plan '${planInfo.plan}' solo permite un máximo de ${productLimit} productos. Estás intentando guardar ${incomingProductCount}.`
        });
      }
      // ==========================================================
      // FIN: Lógica de Validación de Límite de Productos
      // ==========================================================

      // La lógica de subida de archivos ya no es necesaria aquí.
      // El payload `storeData` ya contiene las URLs finales.

      // --- Lógica UPSERT ---
      const { data: existingStore } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('usuario_id', usuarioId)
        .single();

      let finalResult;
      let statusCode;
      let message;

      const payload = {
        usuario_id: usuarioId,
        nombre: storeData.store?.nombre || userRec.nombre,
        descripcion: storeData.store?.descripcion,
        store_type: storeData.store?.store_type, // <-- CORRECCIÓN AÑADIDA
        logo_url: storeData.store?.logoUrl,
        video_url: storeData.store?.video_url,
        installment_options: storeData.store?.installment_options || [],
        products: storeData.products || [],
        activa: launch,
        slug: null, 
        data: storeData,
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
