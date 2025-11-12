import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

// Crear y exportar el cliente de Supabase para usar en el frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
