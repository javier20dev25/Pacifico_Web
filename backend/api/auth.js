const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const jwt = require('jsonwebtoken');

// Middleware para asegurar el parsing de JSON en este router
router.use(express.json());

// --- Helper: Validador de Contraseña ---
function isPasswordStrong(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\x5B\]{};':"\\|,.<>/?]).{6,}$/;
  return regex.test(password);
}

// ==========================================================
// 0. REGISTRO PÚBLICO DE USUARIO (NUEVO FLUJO CON PLANES)
// ==========================================================
router.post('/register', async (req, res, next) => {
  const { nombre, correo, password, planId } = req.body;

  // 1. Validación de entradas
  if (!nombre || !correo || !password || !planId) {
    return res.status(400).json({ error: 'Nombre, correo, contraseña y plan son obligatorios.' });
  }
  if (!isPasswordStrong(password)) {
    return res.status(400).json({ error: 'La contraseña no es suficientemente fuerte.' });
  }

  try {
    // 2. Verificar que el plan exista y obtener su precio
    const { data: plan, error: planError } = await supabaseAdmin
      .from('planes')
      .select('id, precio')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'El plan seleccionado no es válido.' });
    }

    // 3. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: password,
      email_confirm: true, // Auto-confirmar email por ahora
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'Un usuario con este correo ya existe.' });
      }
      return next(new Error(`Error creando usuario en Supabase Auth: ${authError.message}`));
    }
    const authUser = authData.user;

    // 4. Crear el perfil en la tabla 'usuarios'
    const { error: profileError } = await supabaseAdmin.from('usuarios').insert({
      uuid: authUser.id,
      supabase_auth_id: authUser.id,
      nombre: nombre,
      correo: correo,
      role: 'user',
      status: 'active', // El usuario se crea activo, el acceso lo define la suscripción
    });

    if (profileError) {
      return next(new Error(`Error creando perfil de usuario: ${profileError.message}`));
    }

    // 5. Crear la suscripción
    const isFreePlan = parseFloat(plan.precio) === 0;
    const subscriptionStatus = isFreePlan ? 'active' : 'pending_payment';

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('suscripciones')
      .insert({
        usuario_uuid: authUser.id,
        plan_id: plan.id,
        status: subscriptionStatus,
      })
      .select('id')
      .single();

    if (subscriptionError) {
      return next(new Error(`Error creando la suscripción: ${subscriptionError.message}`));
    }

    // 6. Generar token de sesión y responder
    const sessionToken = jwt.sign({ uuid: authUser.id, rol: 'user', email: correo }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      message: '¡Usuario registrado con éxito!',
      sessionToken,
      subscription: {
        id: subscription.id,
        status: subscriptionStatus,
      },
      user: {
        nombre,
        correo,
        rol: 'user',
      },
    });

  } catch (err) {
    next(err); // Pasar errores al manejador central
  }
});


// ==========================================================
// 1. LOGIN DE USUARIO (MÉTODO MODERNO CON SUPABASE AUTH)
// ==========================================================
router.post('/login', async (req, res) => {
  console.log('[DEBUG req.body]', req.body);
  let loginIdentifier = (req.body.correo || req.body.email || '').trim();
  const password = (req.body.contrasena || req.body.password || '')
    .trim()
    .normalize('NFKC');
  
  // --- LÓGICA DE DETECCIÓN DE TELÉFONO ---
  const isPhoneNumber = /^\+?\d[\d\s-()]+$/.test(loginIdentifier);
  if (isPhoneNumber) {
    const normalizedNumber = loginIdentifier.replace(/\D/g, '');
    loginIdentifier = `${normalizedNumber}@riel.pacificoweb.com`;
    console.log(`[DEBUG LOGIN] Identificador detectado como teléfono. Transformado a: ${loginIdentifier}`);
  }
  // --- FIN LÓGICA DE DETECCIÓN ---

  console.log(
    '[DEBUG LOGIN] Intento de login para:',
    loginIdentifier,
    'password_len:',
    password.length
  );

  if (!loginIdentifier || !password) {
    return res
      .status(400)
      .json({ error: 'Correo/Teléfono y contraseña son obligatorios.' });
  }

  console.log('[DEBUG LOGIN] Intento de login con Supabase Auth:', loginIdentifier);

  try {
    // Paso 1: Autenticar al usuario con Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: loginIdentifier, // Usar el identificador procesado
        password: password,
      });

    if (authError) {
      console.error('[ERROR AUTH]', authError.message);
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const { user: authUser } = authData;

    // Paso 2: Realizar DOS consultas para obtener toda la información necesaria.
    // Consulta 1: A la tabla 'usuarios' para obtener el 'role' y 'nombre'.
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('role, status, nombre, uuid')
      .eq('uuid', authUser.id)
      .single();

    if (userError || !userRecord) {
      console.error('[ERROR PROFILE] No se encontró registro en la tabla `usuarios`:', authUser.id, userError);
      return res.status(404).json({ error: 'Perfil de usuario (registro base) no encontrado.' });
    }

    // Consulta 2: A la vista 'vw_usuarios_planes' para obtener el 'plan'.
    const { data: planRecord, error: planError } = await supabaseAdmin
      .from('vw_usuarios_planes')
      .select('plan')
      .eq('usuario_uuid', authUser.id)
      .single();

    if (planError && planError.code !== 'PGRST116') { // PGRST116 = 0 filas encontradas, lo cual es ok
      console.error('[ERROR PROFILE] Error al buscar plan en la vista `vw_usuarios_planes`:', authUser.id, planError);
      // No devolvemos un error fatal, el plan puede ser null
    }

    // Combinar la información. 'userRecord' es la fuente principal.
    const userProfile = { ...userRecord, ...planRecord };

    // Bloquear si el usuario está suspendido
    if (userProfile.status === 'suspended') {
      return res.status(403).json({
        error: 'Esta cuenta ha sido suspendida. Contacta al administrador.',
      });
    }

    // Si el usuario es temporal, debe cambiar su contraseña.
    if (userProfile.status === 'temporary') {
      console.log(`[DEBUG LOGIN] Usuario ${loginIdentifier} es temporal. Forzando cambio de contraseña.`);
      const sessionToken = jwt.sign({ uuid: userProfile.uuid, rol: userProfile.role, email: loginIdentifier }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({
        success: true,
        sessionToken,
        user: { rol: userProfile.role, nombre: userProfile.nombre, plan: userProfile.plan },
        mustChangePassword: true,
      });
    }

    // Paso 3: Generar un token de sesión JWT propio con la información necesaria
    const sessionToken = jwt.sign({ uuid: userProfile.uuid, rol: userProfile.role, email: loginIdentifier }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const responsePayload = {
      success: true,
      sessionToken,
      user: { rol: userProfile.role, nombre: userProfile.nombre, plan: userProfile.plan },
    };

    console.log(
      '[DEBUG /login] Payload de respuesta enviado:',
      JSON.stringify(responsePayload, null, 2)
    );

    res.json(responsePayload);
  } catch (error) {
    console.error('[ERROR LOGIN]', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
// ==========================================================
// 2. COMPLETAR REGISTRO (ACTUALIZAR CONTRASEÑA DEL USUARIO TEMPORAL)
// ==========================================================
router.post('/complete-registration', async (req, res) => {
  const { tempToken, password } = req.body;
  if (!tempToken || !password) {
    return res
      .status(400)
      .json({ error: 'Token y nueva contraseña son requeridos.' });
  }
  if (!isPasswordStrong(password)) {
    return res
      .status(400)
      .json({ error: 'La contraseña no es suficientemente fuerte.' });
  }

  try {
    // 1. Verificar el token temporal
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'complete-registration') {
      return res
        .status(401)
        .json({ error: 'Token inválido para esta operación.' });
    }
    const user_uuid = decoded.uuid;

    // 2. Actualizar la contraseña del usuario en Supabase Auth
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(user_uuid, {
        password: password,
      });

    if (authUpdateError) {
      throw new Error(
        `Error al actualizar la contraseña en Supabase Auth: ${authUpdateError.message}`
      );
    }

    // 3. Actualizar el perfil del usuario en nuestra tabla 'usuarios'
    const { data: updatedUser, error: profileUpdateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        status: 'active',
        temporary_password: null, // Limpiar la contraseña temporal
        actualizado_at: new Date(),
      })
      .eq('uuid', user_uuid)
      .select('uuid, status, nombre, correo, role') // Seleccionar los datos necesarios
      .single();

    if (profileUpdateError) {
      // Opcional: considerar revertir el cambio de contraseña si esto falla.
      throw new Error(
        `Error al actualizar el perfil del usuario: ${profileUpdateError.message}`
      );
    }

    // 4. Notificar al administrador (opcional)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      // const subject = `✅ Usuario Activado: ${updatedUser.nombre} (${updatedUser.correo})`;
      // const text = `El usuario ${updatedUser.nombre} (${updatedUser.correo}) ha completado su registro y activado su cuenta.`;
      // const html = `<p>El usuario <strong>${updatedUser.nombre}</strong> (<code>${updatedUser.correo}</code>) ha completado su registro y activado su cuenta.</p>`;
      // sendEmail(adminEmail, subject, text, html); // Descomentar si el servicio de email está configurado
    }

    // 5. Generar un token de sesión normal y duradero
    const sessionToken = jwt.sign(
      {
        uuid: updatedUser.uuid,
        rol: updatedUser.role,
        email: updatedUser.correo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      status: 'registration_complete',
      message: 'Registro completado. ¡Bienvenido!',
      token: sessionToken,
    });
  } catch (error) {
    console.error('Error completando el registro:', error);
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      return res.status(401).json({
        error: 'El token es inválido o ha expirado. Vuelve a iniciar sesión.',
      });
    }
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// --- INICIO: Endpoints para el nuevo flujo de activación ---

router.get('/verify-activation', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ error: 'Falta el token de activación.' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('usuarios')
            .select('nombre, correo, activation_token_expires_at')
            .eq('activation_token', token)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Tu enlace de activación es inválido o ya ha sido utilizado.' });
        }

        if (new Date(user.activation_token_expires_at) < new Date()) {
            return res.status(410).json({ error: 'Tu enlace de activación ha expirado. Contacta al administrador para recibir uno nuevo.' });
        }

        res.json({ nombre: user.nombre, correo: user.correo });
    } catch (error) {
        console.error('[FATAL] /verify-activation:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

router.post('/complete-activation', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Faltan datos para completar la activación.' });
    }
    if (!isPasswordStrong(password)) {
        return res.status(400).json({ error: 'La contraseña no es suficientemente fuerte.' });
    }

    try {
        // 1. Validar el token y obtener el UUID del usuario
        const { data: user, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('uuid, activation_token_expires_at')
            .eq('activation_token', token)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'Tu enlace de activación es inválido o ya ha sido utilizado.' });
        }
        if (new Date(user.activation_token_expires_at) < new Date()) {
            return res.status(410).json({ error: 'Tu enlace de activación ha expirado.' });
        }
        
        // 2. Actualizar la contraseña del usuario en Supabase Auth
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.uuid, {
            password: password,
        });
        if (authUpdateError) throw new Error(`Error al actualizar contraseña en Auth: ${authUpdateError.message}`);

        // 3. Actualizar nuestro registro de usuario
        await supabaseAdmin
            .from('usuarios')
            .update({
                status: 'active',
                temporary_password: null,
                activation_token: null,
                activation_token_expires_at: null,
                actualizado_at: new Date(),
            })
            .eq('uuid', user.uuid);

        res.status(200).json({
            message: '¡Tu cuenta ha sido activada con éxito! Ahora puedes iniciar sesión con tu nueva contraseña.',
        });

    } catch (error) {
        console.error('[FATAL] /complete-activation:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al completar la activación.' });
    }
});

// --- FIN: Endpoints para el nuevo flujo de activación ---

module.exports = router;
