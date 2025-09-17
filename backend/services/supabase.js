require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error("Supabase URL, Anon Key, or Service Key is missing in .env file");
}

// Cliente público, para operaciones del lado del cliente (navegador)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente de administrador, para operaciones privilegiadas desde el backend
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin };
