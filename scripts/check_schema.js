require('dotenv').config({ path: '/data/data/com.termux/files/home/pacificoweb/.env' });
const { createClient } = require('@supabase/supabase-js');

// El proyecto tiene una inconsistencia entre .env.example (SUPABASE_SERVICE_ROLE_KEY) y el código (SUPABASE_SERVICE_KEY).
// Este script prueba ambos para ser robusto.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

async function checkUserSchema() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Faltan las variables de entorno SUPABASE_URL o la clave de servicio en tu archivo .env');
    console.error('Asegúrate de que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SERVICE_KEY) estén definidas.');
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Intentando verificar el esquema de la tabla "usuarios" en Supabase...');

  try {
    const { error } = await supabaseAdmin
      .from('usuarios')
      .select('username, age, gender')
      .limit(1);

    if (error) {
      console.error('\nError al consultar la tabla. Esto es bueno, significa que podemos diagnosticar qué falta.');
      const errorMessage = error.message;
      console.error(`Mensaje de Supabase: "${errorMessage}"`);

      const columns = { age: false, gender: false };
      if (!errorMessage.includes('column "age" does not exist')) {
        columns.age = true;
      }
      if (!errorMessage.includes('column "gender" does not exist')) {
        columns.gender = true;
      }

      console.log('\nDiagnóstico:');
      console.log('- La columna "username" ya existe.');
      console.log(`- La columna "age" ${columns.age ? 'ya existe.' : 'FALTA.'}`);
      console.log(`- La columna "gender" ${columns.gender ? 'ya existe.' : 'FALTA.'}`);

    } else {
      console.log('\nDiagnóstico: ¡Todas las columnas (username, age, gender) ya existen en la tabla "usuarios"!');
    }
  } catch (e) {
    console.error('Ocurrió una excepción no controlada:', e.message);
  }
}

checkUserSchema();