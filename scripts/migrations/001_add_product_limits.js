// scripts/migrations/001_add_product_limits.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { supabaseAdmin } = require('../../backend/services/supabase');

const MIGRATION_NAME = '001_add_product_limits';

async function runMigration() {
  console.log(`--- Iniciando migración: ${MIGRATION_NAME} ---`);

  try {
    // Paso 1: Añadir la columna 'product_limit' a la tabla 'planes'
    console.log("1. Añadiendo columna 'product_limit' a la tabla 'planes'...");
    const { error: alterError } = await supabaseAdmin.rpc('execute_sql', {
        sql: "ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS product_limit INTEGER NOT NULL DEFAULT 0;"
    });
    if (alterError) throw alterError;
    console.log("   ... Columna 'product_limit' añadida con éxito.");

    // Paso 2: Actualizar los límites de productos para los planes existentes
    console.log("2. Actualizando límites para planes existentes...");
    const updates = [
      { name: 'emprendedor', limit: 20 },
      { name: 'oro_business', limit: 45 },
      { name: 'vendedor_diamante', limit: 60 },
    ];

    for (const plan of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('planes')
        .update({ product_limit: plan.limit })
        .eq('nombre', plan.name);
      if (updateError) {
        console.error(`   - Error actualizando el plan '${plan.name}':`, updateError.message);
      } else {
        console.log(`   - Límite para '${plan.name}' establecido en ${plan.limit}.`);
      }
    }

    // Paso 3: Recrear la vista 'vw_usuarios_planes' para incluir la nueva columna
    console.log("3. Recreando la vista 'vw_usuarios_planes'...");
    
    // Primero, eliminamos la vista existente para evitar conflictos de columnas.
    const dropViewSql = `DROP VIEW IF EXISTS public.vw_usuarios_planes;`;
    const { error: dropError } = await supabaseAdmin.rpc('execute_sql', { sql: dropViewSql });
    if (dropError) throw dropError;
    console.log("   - Vista antigua eliminada (si existía).");

    // Ahora, creamos la vista nueva con la estructura correcta.
    const createViewSql = `
      CREATE VIEW public.vw_usuarios_planes AS
      SELECT
          u.id AS usuario_id,
          u.uuid AS usuario_uuid,
          u.nombre,
          u.correo,
          u.status,
          c.id AS contrato_id,
          p.nombre AS plan,
          p.product_limit,
          c.fecha_inicio,
          c.fecha_expiracion,
          c.activo
      FROM public.usuarios u
      LEFT JOIN public.contratos c ON u.uuid = c.usuario_uuid
      LEFT JOIN public.planes p ON c.plan_id = p.id;
    `;
    const { error: createError } = await supabaseAdmin.rpc('execute_sql', { sql: createViewSql });
    if (createError) throw createError;
    console.log("   ... Vista 'vw_usuarios_planes' creada con éxito con el esquema correcto.");

    // NOTA: Para que rpc('execute_sql', ...) funcione, necesitas una función en tu BD que ejecute SQL.
    // Si no la tienes, créala en el editor SQL de Supabase:
    /*
      CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    */
    console.warn("\nADVERTENCIA: Esta migración asume que tienes una función RPC 'execute_sql' en tu base de datos.");
    console.warn("Si no la tienes, créala ejecutando el SQL comentado en el script en el editor SQL de Supabase.");


    console.log(`\n--- Migración ${MIGRATION_NAME} completada con éxito. ---`);

  } catch (error) {
    console.error(`\n[ERROR FATAL] Falló la migración ${MIGRATION_NAME}:`, error.message);
    process.exit(1);
  }
}

runMigration();
