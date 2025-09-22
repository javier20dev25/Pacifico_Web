const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rutas. Verifica el token JWT personalizado.
 */
const protect = async (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: 'No autorizado. No se proporcionó un token.' });
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

module.exports = { protect };