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
// 1. LOGIN DE USUARIO (MÉTODO MODERNO CON SUPABASE AUTH)
// ==========================================================
router.post('/login', async (req, res) => {
  console.log('[DEBUG req.body]', req.body);
  const correo = (req.body.correo || req.body.email).trim();
  const password = req.body.contrasena || req.body.password;

  if (!correo || !password) {
    return res
      .status(400)
      .json({ error: 'Correo y contraseña son obligatorios.' });
  }

  console.log('[DEBUG LOGIN] Intento de login con Supabase Auth:', correo);

  try {
    // Paso 1: Autenticar al usuario con Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: correo,
        password: password,
      });

    if (authError) {
      console.error('[ERROR AUTH]', authError.message);
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const { user: authUser } = authData;

    // Paso 2: Obtener el perfil del usuario de la tabla 'usuarios' para obtener su rol y estado
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .select('role, status, nombre, uuid')
      .eq('uuid', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error(
        '[ERROR PROFILE] No se encontró perfil para el usuario autenticado:',
        authUser.id,
        profileError
      );
      return res
        .status(404)
        .json({ error: 'Perfil de usuario no encontrado.' });
    }

    // Bloquear si el usuario está suspendido
    if (userProfile.status === 'suspended') {
      return res.status(403).json({
        error: 'Esta cuenta ha sido suspendida. Contacta al administrador.',
      });
    }

    // Si el usuario es temporal, debemos forzar el flujo de completar registro.
    if (userProfile.status === 'temporary') {
      console.log(
        `[DEBUG LOGIN] Usuario ${correo} es temporal. Forzando flujo de registro.`
      );

      // Generar un token temporal de corta duración para este propósito específico.
      const tempToken = jwt.sign(
        {
          uuid: userProfile.uuid,
          purpose: 'complete-registration', // Usar un propósito claro
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // El usuario tiene 15 minutos para cambiar su contraseña
      );

      // Enviar solo el tempToken. El frontend sabrá qué hacer.
      return res.json({ tempToken });
    }

    // Paso 3: Generar un token de sesión JWT propio con la información necesaria
    const sessionToken = jwt.sign(
      {
        uuid: userProfile.uuid,
        rol: userProfile.role,
        email: correo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const responsePayload = {
      success: true,
      sessionToken,
      user: { rol: userProfile.role, nombre: userProfile.nombre },
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

module.exports = router;
