const { createClient } = require('@supabase/supabase-js'); // cargar dotenv si existe (útil para .env)
try {
  require('dotenv').config();
} catch (_e) {
  /* noop */
}
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'WARNING: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontradas. Exportando fallback supabaseAdmin que devuelve resultados vacíos.'
  );
  // Fallback muy simple: métodos que devuelven promesas con estructura { data, error }
  const fallback = {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }), // Añadido para single
        }),
      }),
    }),
    rpc: async () => ({
      data: null,
      error: { message: 'RPC no disponible (faltan claves SUPABASE)' },
    }),
  };
  module.exports = fallback;
} else {
  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { headers: { 'x-my-app': 'pacificoweb-admin' } },
      }
    );
    module.exports = supabaseAdmin;
  } catch (err) {
    console.error('Error creando cliente Supabase:', err);
    // exportar fallback en caso de error
    module.exports = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null }), // Añadido para single
          }),
        }),
      }),
      rpc: async () => ({
        data: null,
        error: { message: 'RPC no disponible (createClient falló)' },
      }),
    };
  }
}
