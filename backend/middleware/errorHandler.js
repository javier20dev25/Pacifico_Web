// backend/middleware/errorHandler.js

/**
 * Middleware de manejo de errores para Express.
 * Captura todos los errores pasados a través de next(error) y los formatea
 * en una respuesta JSON consistente y segura.
 */
function errorHandler(err, req, res) {
  // Loggear el error completo en la consola del servidor para debugging.
  // Es importante no exponer el stack trace al cliente en producción.
  console.error('[ERROR HANDLER]', err.stack || err);

  // Determinar el código de estado. Si el error tiene un `statusCode`,
  // usarlo; de lo contrario, es un error inesperado del servidor (500).
  const statusCode = err.statusCode || 500;

  // Enviar una respuesta JSON genérica y segura al cliente.
  res.status(statusCode).json({
    error: err.message || 'Ocurrió un error inesperado en el servidor.',
  });
}

module.exports = errorHandler;
