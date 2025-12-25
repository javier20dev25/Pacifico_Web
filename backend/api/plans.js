// backend/api/plans.js
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');

/**
 * @route   GET /api/plans
 * @desc    Obtener la lista de todos los planes de suscripción activos
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { data: planes, error } = await supabaseAdmin
      .from('planes')
      .select('id, nombre, precio, detalles')
      .eq('is_active', true)
      .order('precio', { ascending: true });

    if (error) {
      // Si hay un error, lo pasamos al middleware de errores
      return next(error);
    }

    if (!planes) {
      return res.status(404).json({ msg: 'No se encontraron planes activos.' });
    }

    res.json(planes);

  } catch (err) {
    // Capturamos cualquier otro error inesperado
    console.error('Error inesperado en GET /api/plans:', err.message);
    next(err);
  }
});

module.exports = router;
