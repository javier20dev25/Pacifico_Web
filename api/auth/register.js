// api/auth/register.js

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import jwt from 'jsonwebtoken';

// --- Helper: Validador de Contraseña ---
// Lo incluimos aquí directamente para que la función sea autocontenida.
function isPasswordStrong(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{6,}$/;
  return regex.test(password);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  const { nombre, correo, password, planId } = request.body;

  // 1. Validación de entradas
  if (!nombre || !correo || !password || !planId) {
    return response.status(400).json({ error: 'Nombre, correo, contraseña y plan son obligatorios.' });
  }
  if (!isPasswordStrong(password)) {
    return response.status(400).json({ error: 'La contraseña no es suficientemente fuerte.' });
  }

  try {
    // 2. Verificar que el plan exista y obtener su precio
    const { data: plan, error: planError } = await supabaseAdmin
      .from('planes')
      .select('id, precio')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return response.status(404).json({ error: 'El plan seleccionado no es válido.' });
    }

    // 3. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: password,
      email_confirm: true, // Auto-confirmar email
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return response.status(409).json({ error: 'Un usuario con este correo ya existe.' });
      }
      // Para un error inesperado, loguearlo y devolver un 500
      console.error(`Error creando usuario en Supabase Auth: ${authError.message}`);
      return response.status(500).json({ error: 'Error interno al crear el usuario.' });
    }
    const authUser = authData.user;

    // 4. Crear el perfil en la tabla 'usuarios'
    const { error: profileError } = await supabaseAdmin.from('usuarios').insert({
      uuid: authUser.id,
      supabase_auth_id: authUser.id,
      nombre: nombre,
      correo: correo,
      role: 'user',
      status: 'active',
    });

    if (profileError) {
      console.error(`Error creando perfil de usuario: ${profileError.message}`);
      return response.status(500).json({ error: 'Error interno al crear el perfil de usuario.' });
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
      console.error(`Error creando la suscripción: ${subscriptionError.message}`);
      return response.status(500).json({ error: 'Error interno al crear la suscripción.' });
    }

    // 6. Generar token de sesión y responder
    const sessionToken = jwt.sign({ uuid: authUser.id, rol: 'user', email: correo }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return response.status(201).json({
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
    console.error('Error inesperado en /api/auth/register:', err.message);
    return response.status(500).json({ error: 'Error interno inesperado del servidor.' });
  }
}
