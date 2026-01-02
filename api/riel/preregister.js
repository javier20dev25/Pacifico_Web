// api/riel/preregister.js

import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  const { whatsapp_number, name } = request.body;

  if (!name || name.trim() === '') {
    return response.status(400).json({ error: 'Se requiere un nombre.' });
  }
  if (!whatsapp_number || whatsapp_number.length < 8) {
    return response.status(400).json({ error: 'Se requiere un número de WhatsApp válido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('riel_preregistrations')
      .upsert(
        {
          whatsapp_number: whatsapp_number,
          name: name.trim(),
          status: 'pending',
        },
        { onConflict: 'whatsapp_number' }
      )
      .select('identifier')
      .single();

    if (error) {
      // Si el upsert da un error, lo registramos y devolvemos un error de servidor.
      console.error('Supabase upsert error en /preregister:', error.message);
      return response.status(500).json({ error: 'Error al procesar el pre-registro.' });
    }
    
    // Si por alguna razón el upsert no devuelve datos (aunque debería), tenemos una lógica de fallback.
    if (!data || !data.identifier) {
      console.warn('Upsert no devolvió datos, ejecutando fallback de selección.');
      const { data: selectData, error: selectError } = await supabaseAdmin
        .from('riel_preregistrations')
        .select('identifier')
        .eq('whatsapp_number', whatsapp_number)
        .single();
      
      if (selectError || !selectData) {
        throw new Error("No se pudo crear o recuperar el identificador de pre-registro después del fallback.");
      }
      return response.status(200).json({ identifier: selectData.identifier }); // Devolvemos 200 OK porque el recurso ya existía.
    }
    
    // El caso exitoso principal: se creó un nuevo registro.
    return response.status(201).json({ identifier: data.identifier });

  } catch (err) {
    console.error('Error inesperado en /api/riel/preregister:', err.message);
    return response.status(500).json({ error: 'Error interno inesperado del servidor.' });
  }
}
