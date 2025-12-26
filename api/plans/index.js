// api/plans/index.js

// Importamos el cliente de Supabase. La ruta relativa cambia por la nueva ubicación.
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(request, response) {
  // Solo permitir peticiones GET
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  try {
    // La misma lógica que teníamos antes para obtener los planes
    const { data: planes, error } = await supabaseAdmin
      .from('planes')
      .select('id, nombre, precio, detalles')
      .eq('is_active', true)
      .order('precio', { ascending: true });

    if (error) {
      // Si hay un error en la base de datos, lo registramos y devolvemos un 500
      console.error('Supabase error en /api/plans:', error.message);
      return response.status(500).json({ error: 'Error interno del servidor al consultar los planes.' });
    }

    if (!planes) {
      return response.status(404).json({ error: 'No se encontraron planes activos.' });
    }

    // Devolvemos la lista de planes con un status 200 OK
    return response.status(200).json(planes);

  } catch (err) {
    // Capturamos cualquier otro error inesperado
    console.error('Error inesperado en /api/plans:', err.message);
    return response.status(500).json({ error: 'Error interno inesperado del servidor.' });
  }
}
