const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const userUuid = req.user?.uuid || req.user?.user_uuid || req.user?.id;
    if (!userUuid) return res.status(401).json({ error: 'No autenticado.' });

    const {
      customer_name,
      order_date,
      products,
      total_price,
      total_weight,
      raw_message,
    } = req.body;

    if (!customer_name || !order_date || !products || !raw_message) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert([
        {
          user_id: userUuid,
          customer_name,
          order_date,
          products,
          total_price,
          total_weight,
          raw_message,
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error('Error en POST /orders:', err);
    return res.status(500).json({ error: 'Error interno al guardar pedido.' });
  }
});

module.exports = router;
