const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET_NAME = import.meta.env.VITE_STORAGE_BUCKET || 'imagenes';

/**
 * Toma una URL o una ruta de archivo de Supabase Storage y devuelve una URL pública completa.
 * Esto proporciona compatibilidad hacia atrás para las rutas de archivo antiguas que se guardaron
 * sin el dominio de Supabase.
 *
 * @param pathOrUrl - La ruta del archivo (ej. 'uuid/imagen.png') o una URL completa.
 * @returns La URL pública completa y accesible de la imagen.
 */
export function getPublicImageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    // Devuelve una URL de placeholder o una cadena vacía si la entrada es nula/indefinida.
    // Esto previene que las etiquetas <img> hagan peticiones a la raíz del sitio.
    return 'https://via.placeholder.com/150?text=No+Imagen';
  }

  // Si ya es una URL completa o una Data URL, la devolvemos sin cambios.
  if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  // Si es una ruta de archivo, construimos la URL pública completa.
  // Asegurémonos de que SUPABASE_URL termine con una barra.
  const supabaseUrl = SUPABASE_URL.endsWith('/') ? SUPABASE_URL : `${SUPABASE_URL}/`;
  
  return `${supabaseUrl}storage/v1/object/public/${BUCKET_NAME}/${pathOrUrl}`;
}
