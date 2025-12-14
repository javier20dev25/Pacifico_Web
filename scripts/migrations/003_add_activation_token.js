// scripts/migrations/003_add_activation_token.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { supabaseAdmin } = require('../../backend/services/supabase');

const MIGRATION_NAME = '003_add_activation_token';

async function runMigration() {
  console.log(`--- Iniciando migración: ${MIGRATION_NAME} ---`);

  try {
    console.log("1. Añadiendo columnas 'activation_token' y 'activation_token_expires_at' a la tabla 'usuarios'...");
    
    const alterTableSql = `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS activation_token UUID DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMPTZ;

      COMMENT ON COLUMN public.usuarios.activation_token IS 'Token único para la activación de cuentas nuevas, como las de Riel.';
    `;

    const { error } = await supabaseAdmin.rpc('execute_sql', { sql: alterTableSql });
    if (error) throw error;
    
    console.log("   ... Columnas añadidas o ya existentes con éxito.");
    console.log(`\n--- Migración ${MIGRATION_NAME} completada con éxito. ---`);

  } catch (error) {
    console.error(`\n[ERROR FATAL] Falló la migración ${MIGRATION_NAME}:`, error.message);
    process.exit(1);
  }
}

runMigration();
