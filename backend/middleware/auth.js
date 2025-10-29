const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rutas. Verifica el token JWT personalizado.
 */
const protect = async (req, res, next) => {
  const token = req.headers.authorization
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ error: 'No autorizado. No se proporcionó un token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar el usuario al objeto de la petición para uso posterior
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'No autorizado. Token expirado.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'No autorizado. Token inválido.' });
    }
    res.status(401).json({ error: 'No autorizado. Token inválido.' });
  }
};

const isAdmin = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autenticado.' });

    // 1. Comprobación de Super Administrador por email (desde .env)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail && req.user.email === superAdminEmail) {
      console.log(
        `[AUTH] Acceso concedido como Super Administrador a: ${req.user.email}`
      );
      return next();
    }

    // 2. Comprobación estándar por rol en el token
    const role = req.user.rol;
    if (role === 'admin') {
      return next();
    }

    console.warn(
      `[AUTH] Acceso denegado para: ${req.user.email}. Rol encontrado: '${role}'`
    );
    return res
      .status(403)
      .json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  } catch (e) {
    console.error('isAdmin middleware error:', e);
    return res.status(500).json({ error: 'Error en autenticación.' });
  }
};

module.exports = { protect, isAdmin };
