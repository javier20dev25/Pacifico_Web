const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.usuario_id;
    if (!userId) return res.status(401).json({ error: 'No autenticado.' });

    if (typeof supabaseAdmin.rpc === 'function') {
      const { data, error } = await supabaseAdmin.rpc('get_summary', {
        p_user_id: userId,
      });
      if (error) throw error;
      return res.json(data || {}); // Devuelve objeto vacío si data es null
    }
    res.status(400).json({ error: 'Función RPC no disponible.' });
  } catch (err) {
    console.error('Error en /statistics/summary:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
