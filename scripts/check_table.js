async function checkTable() {
  const SUPABASE_URL = 'https://vuoospopyjojarfzjjiu.supabase.co';
  const ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b29zcG9weWpvamFyZnpqaml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTg5MjAsImV4cCI6MjA3MzYzNDkyMH0.IH-h0HlvxeK73Y9wXtvJUwmVRgsFi5RwaiQSmlqv7gM';
  const SERVICE_ROLE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b29zcG9weWpvamFyZnpqaml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1ODkyMCwiZXhwIjoyMDczNjM0OTIwfQ.xV-cQuZrrDJtGvVq0jq6lpDvt30jZWYVI-95dsI4pAo';

  console.log("Intentando consultar la tabla 'pedidos' en Supabase...");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?select=*&limit=1`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (response.ok) {
      console.log("✅ ¡Éxito! La tabla 'pedidos' existe y es accesible.");
    } else {
      const error = await response.json();
      // 42P01 is PostgreSQL's code for undefined_table
      if (error.code === '42P01') {
        console.error(
          "❌ Error: La tabla 'pedidos' no existe. Por favor, créala en tu panel de Supabase."
        );
      } else {
        console.error(
          `❌ Error inesperado al consultar la tabla. Código: ${response.status}`,
          error
        );
      }
    }
  } catch (e) {
    console.error('❌ Fallo en la conexión con el servidor de Supabase.', e);
  }
}

checkTable();
