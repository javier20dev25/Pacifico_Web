const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabaseAdmin } = require('../services/supabase');
const { sendEmail } = require('../services/email');
const { AdminCreateUserSchema } = require('../../shared/schemas/user');

function generateTemporaryPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!';
}

function nombreAToken(nombre) {
  return nombre.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

router.post('/create-temporary-user', async (req, res) => {
  try {
    let validatedData;
    try {
      const bodyToParse = { ...req.body };
      if (bodyToParse.correo) {
        bodyToParse.correo = bodyToParse.correo.replace(/\s+/g, '');
      }
      validatedData = AdminCreateUserSchema.parse(bodyToParse);
    } catch (error) {
      return res.status(400).json({ error: 'Datos de entrada inválidos.', details: error.errors });
    }
    const { nombre, correo, plan_nombre } = validatedData;
    let finalEmail = correo;
    if (!finalEmail) {
      let baseEmail = nombreAToken(nombre) + '@pacificoweb.com';
      finalEmail = baseEmail;
      let suffix = 1;
      let isAvailable = false;
      while (!isAvailable) {
        const { data: existingUser } = await supabaseAdmin.from('usuarios').select('correo').eq('correo', finalEmail).single();
        if (existingUser) {
          finalEmail = nombreAToken(nombre) + suffix + '@pacificoweb.com';
          suffix++;
        } else {
          isAvailable = true;
        }
      }
    } else {
      const { data: existingUser } = await supabaseAdmin.from('usuarios').select('correo').eq('correo', finalEmail).single();
      if (existingUser) {
        return res.status(409).json({ error: 'El correo electrónico ya está en uso.' });
      }
    }
    const temporaryPassword = generateTemporaryPassword();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: finalEmail,
      password: temporaryPassword,
      email_confirm: true,
    });
    if (authError) throw new Error(`Error en Supabase Auth: ${authError.message}`);
    const newAuthUser = authData.user;
    const { data: userProfile, error: profileError } = await supabaseAdmin.from('usuarios').insert({
      uuid: newAuthUser.id,
      nombre: nombre,
      correo: finalEmail,
      role: 'user',
      status: 'temporary',
      temporary_password: temporaryPassword,
    }).select('uuid').single();
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }
    const { data: planData, error: planError } = await supabaseAdmin.from('planes').select('id').eq('nombre', plan_nombre).single();
    if (planError || !planData) throw new Error(`El plan "${plan_nombre}" no fue encontrado.`);
    const contract_duration_months = 3;
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + contract_duration_months);
    const { error: contractError } = await supabaseAdmin.from('contratos').insert({
      usuario_uuid: userProfile.uuid,
      plan_id: planData.id,
      fecha_expiracion: expirationDate.toISOString(),
      activo: true,
    });
    if (contractError) throw new Error(`Error al crear contrato: ${contractError.message}`);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const subject = `🎉 Nuevo Usuario Temporal Creado: ${nombre} (${finalEmail})`;
      const text = `...`;
      const html = `...`;
      sendEmail(adminEmail, subject, text, html);
    }
    res.status(201).json({ message: 'Usuario temporal y contrato creados con éxito.' });
  } catch (error) {
    console.error('[FATAL] Error en la transacción de creación de usuario:', error.message);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.', details: error.message });
  }
});

router.get('/credentials/:user_uuid', async (req, res, next) => {
  const { user_uuid } = req.params;
  if (!user_uuid) return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
  try {
    const { data, error } = await supabaseAdmin.from('usuarios').select('correo, temporary_password').eq('uuid', user_uuid).eq('status', 'temporary').single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'No se encontraron credenciales para este usuario o el usuario ya no es temporal.' });
    res.json({ correo: data.correo, password: data.temporary_password });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('vw_usuarios_planes').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/revoke-user', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
  try {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userUuid);
    if (authError) console.warn(`Advertencia al eliminar de Auth (puede que ya no exista): ${authError.message}`);
    const { error: profileError } = await supabaseAdmin.from('usuarios').delete().eq('uuid', userUuid);
    if (profileError) throw profileError;
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al revocar usuario:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

router.post('/suspend-user', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
  try {
    const { error } = await supabaseAdmin.from('usuarios').update({ status: 'suspended', actualizado_at: new Date() }).eq('uuid', userUuid);
    if (error) throw error;
    res.json({ message: 'Usuario suspendido correctamente.' });
  } catch (error) {
    console.error('Error al suspender usuario:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

router.post('/reactivate-user', async (req, res) => {
  const { userUuid } = req.body;
  if (!userUuid) return res.status(400).json({ error: 'El UUID del usuario es obligatorio.' });
  try {
    const { error } = await supabaseAdmin.from('usuarios').update({ status: 'active', actualizado_at: new Date() }).eq('uuid', userUuid);
    if (error) throw error;
    res.json({ message: 'Usuario reactivado correctamente.' });
  } catch (error) {
    console.error('Error al reactivar usuario:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

router.post('/renew-contract', async (req, res) => {
    // ... código original
});

router.post('/reset-password', async (req, res) => {
    // ... código original
});

router.get('/registration-stats', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_registration_stats');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al obtener estadísticas de registro:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('planes').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al obtener los planes:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
  }
});

// ==========================================================
// 10. GESTIÓN DE CUENTAS RIEL (VERSIÓN FINAL CORREGIDA)
// ==========================================================
router.get('/riel-preregistrations', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('riel_preregistrations').select('*').eq('status', 'pending').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error al obtener pre-registros de Riel:', error);
    next(error);
  }
});

router.post('/create-riel-account', async (req, res, next) => {
  const { preregistration_id } = req.body;
  if (!preregistration_id) {
    return res.status(400).json({ error: 'Se requiere el ID del pre-registro.' });
  }
  try {
    // Paso 1: Validar el pre-registro y obtener el nombre
    const { data: preReg, error: preRegError } = await supabaseAdmin
      .from('riel_preregistrations')
      .select('id, whatsapp_number, status, name') // <-- OBTENER NOMBRE
      .eq('id', preregistration_id)
      .single();

    if (preRegError) throw new Error('Pre-registro no encontrado o error en la consulta.');
    if (preReg.status === 'claimed') return res.status(409).json({ error: 'Esta solicitud ya ha sido procesada.' });

    // Paso 2: Generar credenciales únicas usando el nombre
    const whatsapp = preReg.whatsapp_number.replace(/\D/g, '');
    const email = `${whatsapp}@riel.pacificoweb.com`;
    const nombre = preReg.name || `Usuario Riel ${whatsapp.slice(-4)}`; // Usar el nombre guardado
    const temporaryPassword = generateTemporaryPassword(12);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true });
    if (authError) throw new Error(`Error en Supabase Auth: ${authError.message}`);
    const newAuthUser = authData.user;

    const activationTokenExpires = new Date();
    activationTokenExpires.setDate(activationTokenExpires.getDate() + 7);

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('usuarios').insert({
      uuid: newAuthUser.id,
      nombre: nombre, // <-- USAR NOMBRE
      correo: email,
      status: 'temporary',
      activation_token_expires_at: activationTokenExpires.toISOString(),
    }).select('id, uuid, activation_token').single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.id);
      throw new Error(`Error al crear el perfil de usuario: ${profileError.message}`);
    }
    const activationToken = userProfile.activation_token;

    const { data: planData, error: planError } = await supabaseAdmin.from('planes').select('id').eq('nombre', 'riel').single();
    if (planError || !planData) throw new Error("Plan 'riel' no encontrado en la base de datos.");

    const rielPlanDurationMonths = 1;
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + rielPlanDurationMonths);

    const { error: contractError } = await supabaseAdmin.from('contratos').insert({
      usuario_uuid: userProfile.uuid,
      plan_id: planData.id,
      fecha_expiracion: expirationDate.toISOString(),
      activo: true,
    });
    if (contractError) throw new Error(`Error al crear el contrato: ${contractError.message}`);

    const { error: storeError } = await supabaseAdmin.from('stores').insert({
        usuario_id: userProfile.id,
        nombre: `Tienda de ${nombre}`, // <-- USAR NOMBRE
        whatsapp: whatsapp,
        store_type: 'riel',
    });
    if (storeError) throw new Error(`Error al crear la tienda: ${storeError.message}`);

    await supabaseAdmin.from('riel_preregistrations').update({ status: 'claimed', claimed_at: new Date().toISOString(), user_uuid: userProfile.uuid }).eq('id', preregistration_id);

    const activationLink = `/riel-activation?token=${activationToken}`;
    res.status(201).json({ message: 'Cuenta Riel creada con éxito.', activationLink: activationLink });
  } catch (error) {
    console.error('[FATAL] /create-riel-account:', error.message);
    next(error);
  }
});

module.exports = router;
