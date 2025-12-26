// api/auth/login.js

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import jwt from 'jsonwebtoken';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  let loginIdentifier = (request.body.correo || request.body.email || '').trim();
  const password = (request.body.contrasena || request.body.password || '').trim().normalize('NFKC');

  const isPhoneNumber = /^\+?\d[\d\s-()]+$/.test(loginIdentifier);
  if (isPhoneNumber) {
    const normalizedNumber = loginIdentifier.replace(/\D/g, '');
    loginIdentifier = `${normalizedNumber}@riel.pacificoweb.com`;
  }

  if (!loginIdentifier || !password) {
    return response.status(400).json({ error: 'Correo/Teléfono y contraseña son obligatorios.' });
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: loginIdentifier,
      password: password,
    });

    if (authError) {
      console.error('[API /login] Auth Error:', authError.message);
      return response.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const { user: authUser } = authData;

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('role, status, nombre, uuid')
      .eq('uuid', authUser.id)
      .single();

    if (userError || !userRecord) {
      console.error('[API /login] Profile Error:', userError?.message);
      return response.status(404).json({ error: 'Perfil de usuario no encontrado.' });
    }

    const { data: planRecord } = await supabaseAdmin
      .from('vw_usuarios_planes')
      .select('plan')
      .eq('usuario_uuid', authUser.id)
      .single();

    const userProfile = { ...userRecord, ...planRecord };

    if (userProfile.status === 'suspended') {
      return response.status(403).json({ error: 'Esta cuenta ha sido suspendida.' });
    }

    const sessionToken = jwt.sign({ uuid: userProfile.uuid, rol: userProfile.role, email: loginIdentifier }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const responsePayload = {
      success: true,
      sessionToken,
      user: { rol: userProfile.role, nombre: userProfile.nombre, plan: userProfile.plan },
      mustChangePassword: userProfile.status === 'temporary',
    };

    return response.status(200).json(responsePayload);
  } catch (error) {
    console.error('[API /login] Fatal Error:', error.message);
    return response.status(500).json({ error: 'Error interno del servidor.' });
  }
}
