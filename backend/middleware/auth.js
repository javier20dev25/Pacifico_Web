const { supabase } = require('../services/supabase');

/**
 * Middleware para proteger rutas. Verifica el token JWT de Supabase.
 */
const protect = async (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: 'No autorizado. No se proporcionó un token.' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'No autorizado. Token inválido.' });
        }

        // Adjuntar el usuario al objeto de la petición para uso posterior
        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({ error: 'No autorizado. Token inválido.' });
    }
};

module.exports = { protect };
