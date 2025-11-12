// react-editor/src/utils/ensureFile.ts

// --- Tipos de entrada más específicos ---
type UriFile = { uri: string; name?: string; type?: string };
type Base64File = { base64: string; type: string; name?: string; };
type DataFile = { data: string; type: string; name?: string; };

// Tipo de unión que representa todos los formatos de entrada que la función puede manejar.
type FileLike = 
  | string 
  | File 
  | Blob 
  | UriFile
  | Base64File
  | DataFile
  | null 
  | undefined;

export async function ensureFile(input: FileLike, filename = `upload_${Date.now()}`): Promise<File | null> {
  // 0) null/undefined => nada que subir
  if (input == null) return null;

  // 0.5) objeto vacío => tratar como "sin archivo"
  if (typeof input === 'object' && !Array.isArray(input) && !(input instanceof Blob) && Object.keys(input).length === 0) {
    return null;
  }

  // 1) Si ya es File/Blob
  if (input instanceof File) return input;
  if (input instanceof Blob) return new File([input], filename);

  // 2) Si es una data URL (base64)
  if (typeof input === 'string' && input.startsWith('data:')) {
    try {
      const res = await fetch(input);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (e) {
      console.warn('ensureFile: fallo al convertir dataURL a Blob', e);
      return null;
    }
  }

  // 3) Si es string que parece ser una URL (http(s) or /path)
  if (typeof input === 'string' && (input.startsWith('http') || input.startsWith('/'))) {
    try {
      const res = await fetch(input);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (e) {
      console.warn('ensureFile: fallo al fetchear la URL', input, e);
      return null;
    }
  }

  // 4) { uri: '...' } mobile wrappers (Type Guard: 'uri' in input)
  if (typeof input === 'object' && 'uri' in input && input.uri) {
    try {
      const res = await fetch(input.uri);
      const blob = await res.blob();
      const ext = (input.name && input.name.split('.').pop()) || '';
      const name = input.name || `${filename}${ext ? '.' + ext : ''}`;
      return new File([blob], name, { type: input.type || 'application/octet-stream' });
    } catch (e) {
      console.warn('ensureFile: no se pudo fetch la uri', input.uri, e);
      return null;
    }
  }

  // 5) { base64, type, name } (Type Guard: 'base64' or 'data' in input)
  if (typeof input === 'object' && ('base64' in input || 'data' in input) && 'type' in input) {
    try {
      const base64 = 'base64' in input ? input.base64 : input.data;
      const res = await fetch(`data:${input.type};base64,${base64}`);
      const blob = await res.blob();
      return new File([blob], input.name || filename, { type: input.type });
    } catch (e) {
      console.warn('ensureFile: fallo al convertir objeto base64', e);
      return null;
    }
  }

  // No soportado -> retornar null (en vez de lanzar) para que el uploader lo maneje
  console.warn('ensureFile: Unsupported file input, returning null', input);
  return null;
}