const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { sendEmail } = require('../services/email');
const { AdminCreateUserSchema } = require('../../shared/schemas/user');

// --- Helper: Generador de Contraseña ---
function generateTemporaryPassword(length = 10) {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
} // --- Helper: Generador de Correo a partir del nombre de la tienda ---
function nombreAToken(nombre) {
  return nombre
    .toLowerCase()
    .replace(/\s+/g, '') // quitar espacios
    .replace(/[^a-z0-9]/g, ''); // quitar caracteres especiales
} // ==========================================================
// 1. CREAR USUARIO TEMPORAL
// ==========================================================
router.post('/create-temporary-user', async (req, res) => {
  try {
    console.log('[DEBUG] create-temporary-user body ->', req.body);

    // 1. Sanitización y Validación de entrada con Zod
    let validatedData;
    try {
      const bodyToParse = { ...req.body };
      if (bodyToParse.correo) {
        // Eliminar TODOS los espacios del correo antes de validar
        bodyToParse.correo = bodyToParse.correo.replace(/\s+/g, '');
      }
      validatedData = AdminCreateUserSchema.parse(bodyToParse);
    } catch (error) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos.',
        details: error.errors,
      });
    }
    const { nombre, correo, plan_nombre } = validatedData;
    let finalEmail = correo;

    // 2. Generar email si no se proveyó uno
    if (!finalEmail) {
      let baseEmail = nombreAToken(nombre) + '@pacificoweb.com';
      finalEmail = baseEmail;
      let suffix = 1;
      let isAvailable = false;
      while (!isAvailable) {
        const { data: existingUser } = await supabaseAdmin
          .from('usuarios')
          .select('correo')
          .eq('correo', finalEmail)
          .single();

        if (existingUser) {
          finalEmail = nombreAToken(nombre) + suffix + '@pacificoweb.com';
          suffix++;
        } else {
          isAvailable = true;
        }
      }
    } else {
      const { data: existingUser } = await supabaseAdmin
        .from('usuarios')
        .select('correo')
        .eq('correo', finalEmail)
        .single();
      if (existingUser) {
        return res
          .status(409)
          .json({ error: 'El correo electrónico ya está en uso.' });
      }
    }

    // 3. Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();

    // 4. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: finalEmail,
        password: temporaryPassword,
        email_confirm: true,
      });

    if (authError) {
      throw new Error(`Error en Supabase Auth: ${authError.message}`);
    }

    const newAuthUser = authData.user;

    // 5. Insertar el perfil en la tabla public.usuarios
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        uuid: newAuthUser.id,
        nombre: nombre,
        correo: finalEmail,
        role: 'user',
        status: 'temporary',
        temporary_password: temporaryPassword, // Guardar la contraseña temporal
      })
      .select('uuid')
      .single();

    if (profileError) {
      // Si falla la inserción del perfil, borrar el usuario de Auth para no dejar huérfanos
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    // 6. Obtener el ID del plan
    const { data: planData, error: planError } = await supabaseAdmin
      .from('planes')
      .select('id')
      .eq('nombre', plan_nombre)
      .single();

    if (planError || !planData) {
      throw new Error(`El plan "${plan_nombre}" no fue encontrado.`);
    }

    // 7. Crear el contrato
    const contract_duration_months = 3;
    const expirationDate = new Date();
    expirationDate.setMonth(
      expirationDate.getMonth() + contract_duration_months
    );

    const { error: contractError } = await supabaseAdmin
      .from('contratos')
      .insert({
        usuario_uuid: userProfile.uuid,
        plan_id: planData.id,
        fecha_expiracion: expirationDate.toISOString(),
        activo: true,
      });

    if (contractError) {
      throw new Error(`Error al crear contrato: ${contractError.message}`);
    }

    // 8. Enviar email de notificación al administrador
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const subject = `🎉 Nuevo Usuario Temporal Creado: ${nombre} (${finalEmail})`;
      const text = `Se ha creado un nuevo usuario temporal:\nNombre: ${nombre}\nCorreo: ${finalEmail}\nPlan: ${plan_nombre}\nContraseña Temporal: ${temporaryPassword}...`;
      const html = `<p>Se ha creado un nuevo usuario temporal:</p><ul><li><strong>Nombre:</strong> ${nombre}</li><li><strong>Correo:</strong> ${finalEmail}</li><li><strong>Plan:</strong> ${plan_nombre}</li><li><strong>Contraseña Temporal:</strong> <code>${temporaryPassword}</code></li></ul>...`;
      sendEmail(adminEmail, subject, text, html);
    }

    // Ya no se envían las credenciales directamente, se consultarán a demanda
    res.status(201).json({
      message: 'Usuario temporal y contrato creados con éxito.',
    });
  } catch (error) {
    console.error(
      '[FATAL] Error en la transacción de creación de usuario:',
      error.message
    );
    res.status(500).json({
      error: 'Ocurrió un error inesperado en el servidor.',
      details: error.message,
    });
  }
});

// ==========================================================
// 2. OBTENER CREDENCIALES DE USUARIO TEMPORAL
// ==========================================================
router.get('/credentials/:user_uuid', async (req, res, next) => {
  const { user_uuid } = req.params;
  if (!user_uuid) {
    return res
      .status(400)
      .json({ error: 'El UUID del usuario es obligatorio.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('correo, temporary_password')
      .eq('uuid', user_uuid)
      .eq('status', 'temporary')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error:
          'No se encontraron credenciales para este usuario o el usuario ya no es temporal.',
      });
    }

    res.json({
      correo: data.correo,
      password: data.temporary_password,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================================
// 3. LISTAR TODOS LOS USUARIOS (usando la VISTA)
// ==========================================================
router.get('/users', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('vw_usuarios_planes')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    // En lugar de manejar el error aquí, lo pasamos al middleware central.
    next(error);
  }
});

// ==========================================================
// 4. REVOCAR/ELIMINAR USUARIO
// ==========================================================
router.post('/revoke-user', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) {
    return res
      .status(400)
      .json({ error: 'El UUID del usuario es obligatorio.' });
  }
  try {
    // Primero se elimina el usuario de auth, lo que debería hacer un CASCADE a la tabla usuarios
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userUuid);
    if (authError) {
      // Si el usuario ya no existe en auth, puede que solo quede el perfil. Intentamos borrarlo.
      console.warn(
        `Advertencia al eliminar de Auth (puede que ya no exista): ${authError.message}`
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('uuid', userUuid);

    if (profileError) throw profileError;

    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al revocar usuario:', error);
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// ==========================================================
// 5. SUSPENDER USUARIO
// ==========================================================
router.post('/suspend-user', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) {
    return res
      .status(400)
      .json({ error: 'El UUID del usuario es obligatorio.' });
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
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// ==========================================================
// 5.1. REACTIVAR USUARIO
// ==========================================================
router.post('/reactivate-user', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) {
    return res
      .status(400)
      .json({ error: 'El UUID del usuario es obligatorio.' });
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
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// ==========================================================
// 6. RENOVAR CONTRATO
// ==========================================================
router.post('/renew-contract', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) {
    return res
      .status(400)
      .json({ error: 'El UUID del usuario es obligatorio.' });
  }
  try {
    const { data: currentContract, error: contractError } = await supabaseAdmin
      .from('contratos')
      .select('id, fecha_expiracion')
      .eq('usuario_uuid', userUuid)
      .eq('activo', true)
      .single();
    if (contractError || !currentContract) {
      return res.status(404).json({
        error: 'No se encontró un contrato activo para este usuario.',
      });
    }
    const newExpirationDate = new Date(currentContract.fecha_expiracion);
    newExpirationDate.setMonth(newExpirationDate.getMonth() + 3);
    const { error: updateError } = await supabaseAdmin
      .from('contratos')
      .update({ fecha_expiracion: newExpirationDate.toISOString() })
      .eq('id', currentContract.id);
    if (updateError) throw updateError;
    res.json({
      message: 'Contrato renovado correctamente.',
      newExpirationDate: newExpirationDate.toLocaleDateString(),
    });
  } catch (error) {
    console.error('Error al renovar contrato:', error);
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// ==========================================================
// 7. RESETEAR CONTRASEÑA (NUEVO MÉTODO: GENERAR NUEVA CONTRASEÑA TEMPORAL)
// ==========================================================
router.post('/reset-password', async (req, res) => {
  const { userUuid, email } = req.body; // Aceptamos email o uuid para flexibilidad

  if (!userUuid && !email) {
    return res
      .status(400)
      .json({ error: 'Se requiere el UUID o el correo del usuario.' });
  }

  try {
    let targetUser;

    // 1. Buscar al usuario para obtener su UUID y nombre
    if (userUuid) {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('uuid, nombre, correo')
        .eq('uuid', userUuid)
        .single();
      if (error || !data)
        throw new Error('Usuario no encontrado con ese UUID.');
      targetUser = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('uuid, nombre, correo')
        .eq('correo', email)
        .single();
      if (error || !data)
        throw new Error('Usuario no encontrado con ese correo.');
      targetUser = data;
    }

    // 2. Generar una nueva contraseña temporal
    const newTemporaryPassword = generateTemporaryPassword();

    // 3. Actualizar la contraseña del usuario en Supabase Auth
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(targetUser.uuid, {
        password: newTemporaryPassword,
      });
    if (authUpdateError)
      throw new Error(
        `Error al actualizar contraseña en Supabase: ${authUpdateError.message}`
      );

    // 4. Actualizar el perfil del usuario en nuestra tabla para forzar el flujo de primer login
    const { error: profileUpdateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        status: 'temporary',
        temporary_password: newTemporaryPassword,
        actualizado_at: new Date(),
      })
      .eq('uuid', targetUser.uuid);
    if (profileUpdateError)
      throw new Error(
        `Error al actualizar el perfil local: ${profileUpdateError.message}`
      );

    // 5. Preparar el mensaje para el administrador
    const copyPasteMessage = `Hola ${targetUser.nombre}, hemos reseteado tu cuenta. Puedes volver a entrar con esta nueva contraseña temporal:\n\nCorreo: ${targetUser.correo}\nContraseña: ${newTemporaryPassword}\n\nAl entrar, el sistema te pedirá que establezcas una nueva contraseña personal.`;

    // 6. Devolver el mensaje para que el admin lo copie
    res.json({
      message:
        'Contraseña reseteada con éxito. El usuario deberá cambiarla en su próximo inicio de sesión.',
      copyPasteMessage: copyPasteMessage,
    });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({
      error: 'Ocurrió un error inesperado en el servidor.',
      details: error.message,
    });
  }
});

// ==========================================================
// 8. OBTENER ESTADÍSTICAS DE REGISTRO
// ==========================================================
router.get('/registration-stats', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_registration_stats');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al obtener estadísticas de registro:', error);
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// ==========================================================
// 9. OBTENER LISTA DE PLANES
// ==========================================================
router.get('/plans', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('planes').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al obtener los planes:', error);
    res
      .status(500)
      .json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});
module.exports = router;
