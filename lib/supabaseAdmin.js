/**
 * Wrapper para asegurar compatibilidad: re-exporta la implementación que vive en api/_lib.
 * No expone valores de entorno. Si tu proyecto es ESM o CommonJS esto intenta ser compatible.
 */
try {
  // Para require (CommonJS)
  module.exports = require('../api/_lib/supabaseAdmin');
} catch (e) {
  // Si falló, intenta import dinámico ESM (no falla en entornos que no soporten)
  // eslint-disable-next-line no-empty
}
try {
  // Para compatibilidad con import default
  exports.default = module.exports;
} catch (e) {
  // noop
}
