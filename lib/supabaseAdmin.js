/**
 * Wrapper para compatibilidad: reexporta la implementación que vive en api/_lib.
 * Intenta cargar con require (CommonJS) y, si es ESM, hace import dinámico.
 */
try {
  // Para CommonJS
  module.exports = require('../api/_lib/supabaseAdmin');
} catch (err) {
  // Si el require falla (por ESM u otra razón), intentamos import dinámico.
  (async () => {
    try {
      const mod = await import('../api/_lib/supabaseAdmin.js');
      module.exports = mod.default || mod;
    } catch (e) {
      // Fallo: dejamos el error para que el build muestre un error claro.
      console.error('Failed to load api/_lib/supabaseAdmin:', e);
    }
  })();
}