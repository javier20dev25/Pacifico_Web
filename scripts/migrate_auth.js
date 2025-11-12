require('dotenv').config();

// --- Verificación de variables de entorno ---
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '\n❌ Error Crítico: Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY no se encontraron.'
  );
  console.error(
    'Por favor, asegúrate de que existe un archivo .env en la raíz del proyecto con el siguiente contenido:\n'
  );
  console.log('SUPABASE_URL=https://tu-id-de-proyecto.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu_llave_de_servicio_secreta\n');
  process.exit(1); // Detiene la ejecución si las claves no están presentes.
}
// -------------------------------------------

const supabaseAdmin = require('../backend/lib/supabaseAdmin');

/**
 * ------------------------------------------------------------------------------
 * Script para migrar usuarios de `public.usuarios` a `auth.users` de Supabase.
 * ------------------------------------------------------------------------------
 */
async function migrateUsers() {
  console.log(
    'Iniciando script de migración con el método correcto (listUsers)...'
  );

  const { data: usersToMigrate, error: fetchError } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .is('supabase_auth_id', null);

  if (fetchError) {
    console.error(
      'Error al obtener los usuarios a migrar:',
      fetchError.message
    );
    return;
  }

  if (!usersToMigrate || usersToMigrate.length === 0) {
    console.log(
      '✅ No hay usuarios nuevos para migrar. La base de datos está al día.'
    );
    return;
  }

  console.log(`Se encontraron ${usersToMigrate.length} usuarios para migrar.`);

  // Obtener la lista de todos los usuarios de auth.users UNA SOLA VEZ para eficiencia.
  const {
    data: { users: authUsers },
    error: listError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error(
      'Error crítico: No se pudo obtener la lista de usuarios de Supabase Auth:',
      listError.message
    );
    return;
  }

  for (const user of usersToMigrate) {
    try {
      console.log(
        `--- Procesando usuario: ${user.correo} (ID: ${user.id}) ---`
      );

      // 1. Buscar si el usuario ya existe en la lista de auth.users.
      const existingUser = authUsers.find((u) => u.email === user.correo);

      if (existingUser) {
        // 2. El usuario SÍ existe, así que solo lo vinculamos.
        console.warn(
          `El usuario ${user.correo} ya existe en Auth con ID: ${existingUser.id}. Vinculando...`
        );
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ supabase_auth_id: existingUser.id })
          .eq('id', user.id);
        if (updateError)
          throw new Error(
            `Error al vincular usuario existente: ${updateError.message}`
          );
        console.log(`✅ Usuario ${user.correo} vinculado exitosamente.`);
      } else {
        // 3. El usuario NO existe, así que lo invitamos.
        console.log(`El usuario no existe en Auth, procediendo a invitar...`);
        const { data: invitedData, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(user.correo);
        if (inviteError)
          throw new Error(
            `Error al invitar al nuevo usuario: ${inviteError.message}`
          );

        const newAuthUserId = invitedData.user.id;
        console.log(`Usuario invitado. Nuevo ID de Auth: ${newAuthUserId}`);

        // Vincular el nuevo ID
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ supabase_auth_id: newAuthUserId })
          .eq('id', user.id);
        if (updateError)
          throw new Error(
            `Error al vincular nuevo usuario: ${updateError.message}`
          );
        console.log(
          `✅ Usuario ${user.correo} migrado y vinculado exitosamente.`
        );
      }
    } catch (e) {
      console.error(
        `❌ Error fatal procesando al usuario ${user.correo}: ${e.message}`
      );
    }
    console.log('--------------------------------------------------\n');
  }

  console.log('🎉 Proceso de migración finalizado.');
}

// Ejecutar la función principal
migrateUsers().catch((e) => {
  console.error('Ocurrió un error fatal durante la migración:', e);
});
