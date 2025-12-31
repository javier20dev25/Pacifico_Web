// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

// Cargar las variables de entorno de forma segura.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Si las variables de entorno no están definidas, el proceso debe fallar inmediatamente.
// Esto previene errores silenciosos en producción y facilita la depuración.
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

/**
 * Cliente de administración de Supabase.
 * Se utiliza para operaciones de backend que requieren privilegios de 'service_role'.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      // Importante: deshabilita la persistencia de sesión en el lado del servidor.
      persistSession: false,
      // Detecta automáticamente si el fetch está disponible en el entorno (necesario para Node).
      autoRefreshToken: false,
    },
  }
);