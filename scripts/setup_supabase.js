const SUPABASE_URL = 'https://vuoospopyjojarfzjjiu.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b29zcG9weWpvamFyZnpqaml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTg5MjAsImV4cCI6MjA3MzYzNDkyMH0.IH-h0HlvxeK73Y9wXtvJUwmVRgsFi5RwaiQSmlqv7gM';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b29zcG9weWpvamFyZnpqaml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1ODkyMCwiZXhwIjoyMDczNjM0OTIwfQ.xV-cQuZrrDJtGvVq0jq6lpDvt30jZWYVI-95dsI4pAo';

async function insert(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok)
    throw new Error(`Error al insertar en ${table}: ${await response.text()}`);
  return response.json();
}

async function select(table) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!response.ok)
    throw new Error(`Error al consultar ${table}: ${await response.text()}`);
  return response.json();
}

async function update(table, id, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok)
    throw new Error(
      `Error al actualizar en ${table}: ${await response.text()}`
    );
  return response.json();
}

async function remove(table, id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (response.status !== 204)
    throw new Error(
      `Error al eliminar de ${table} (status ${response.status}): ${await response.text()}`
    );
  return { success: true };
}

async function main() {
  try {
    console.log('Iniciando prueba de la API de Supabase (CRUD)...');
    console.log(
      "Asumiendo que las tablas 'usuarios', 'productos' y 'pedidos' ya existen."
    );
    console.log('\n--- Demostración de uso de la API ---');
    console.log('Insertando un nuevo usuario...');
    const nuevoUsuario = await insert('usuarios', {
      nombre: 'Astaroth',
      correo: `astaroth-${Date.now()}@infernal.dev`,
    });
    console.log('Usuario insertado:', nuevoUsuario);
    const usuarioId = nuevoUsuario[0].id;
    console.log('\nConsultando todos los usuarios...');
    const todosLosUsuarios = await select('usuarios');
    console.log(
      `Usuarios encontrados (${todosLosUsuarios.length}):`,
      todosLosUsuarios
    );
    console.log(`\nActualizando el nombre del usuario con ID ${usuarioId}...
`);
    const usuarioActualizado = await update('usuarios', usuarioId, {
      nombre: 'Astaroth, El Gran Duque',
    });
    console.log('Usuario actualizado:', usuarioActualizado);
    console.log(`\nEliminando el usuario con ID ${usuarioId}...
`);
    await remove('usuarios', usuarioId);
    console.log('✅ Usuario de prueba eliminado.');
    console.log(
      '\n🎉 ¡Prueba finalizada! La conexión y las operaciones CRUD funcionan correctamente.'
    );
  } catch (error) {
    console.error(
      '\n❌ Error durante la ejecución de la prueba:',
      error.message
    );
  }
}

main();
