const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

// Middleware to ensure user is authenticated
router.use(protect);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               store_id:
 *                 type: integer
 *               customer_info:
 *                 type: object
 *               order_content:
 *                 type: object
 *               total_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request, missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const { store_id, customer_info, order_content, total_amount, plan_tipo, plan_frecuencia, plan_cuotas } = req.body;
  const user_id = req.user.id; // From authMiddleware

  if (!store_id || !customer_info || !order_content || !total_amount) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert([
        {
          store_id,
          user_id,
          customer_info,
          order_content,
          total_amount,
          plan_tipo, 
          plan_frecuencia, 
          plan_cuotas,
          // payment_status and delivery_status have default values in DB
        },
      ])
      .select();

    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: 'Failed to create order.', details: error.message });
    }

    res.status(201).json({ message: 'Order created successfully', order: data[0] });
  } catch (err) {
    console.error('Exception while creating order:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     description: Retrieves a list of all orders associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of orders
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  const user_id = req.user.id;

  try {
    // LLamar a la función RPC en lugar de hacer un select directo
    const { data, error } = await supabaseAdmin.rpc('get_orders_with_status', { 
      p_user_id: user_id 
    });

    if (error) {
      console.error('Error fetching orders with status:', error);
      return res.status(500).json({ error: 'Failed to fetch orders.', details: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Exception while fetching orders:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an order's status
 *     description: Updates the payment or delivery status of a specific order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_status:
 *                 type: string
 *               delivery_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: No valid fields to update
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { payment_status, delivery_status, plan_tipo, plan_frecuencia, plan_cuotas } = req.body;
  const user_id = req.user.id;

  const updateFields = {};
  if (payment_status) updateFields.payment_status = payment_status;
  if (delivery_status) updateFields.delivery_status = delivery_status;
  if (plan_tipo) updateFields.plan_tipo = plan_tipo;
  if (plan_frecuencia) updateFields.plan_frecuencia = plan_frecuencia;
  if (plan_cuotas !== undefined) updateFields.plan_cuotas = plan_cuotas;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user_id) // Security check
      .select();

    if (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Failed to update order.', details: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Order not found or you do not have permission to update it.' });
    }

    res.status(200).json({ message: 'Order updated successfully', order: data[0] });
  } catch (err) {
    console.error('Exception while updating order:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Middleware to check if the user owns the order
const checkOrderOwnership = async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const { data: order, error } = await supabaseAdmin
    .from('pedidos')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.user_id !== user_id) {
    return res.status(403).json({ error: 'You do not have permission to access this order.' });
  }

  req.order = order; // Pass the order to the next handler
  next();
};

/**
 * @swagger
 * /api/orders/{id}/abonos:
 *   get:
 *     summary: Get all payments for a specific order
 *     description: Retrieves a list of all payments (abonos) for a specific order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of payments
 *       404:
 *         description: Order not found
 */
router.get('/:id/abonos', checkOrderOwnership, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('abonos')
      .select('*')
      .eq('pedido_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payments.' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Exception while fetching payments:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/abonos:
 *   post:
 *     summary: Add a payment to a specific order
 *     description: Adds a new payment (abono) to a specific order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: 'number' }
 *               payment_method: { type: 'string' }
 *               notes: { type: 'string' }
 *     responses:
 *       201:
 *         description: Payment added successfully
 *       400:
 *         description: Bad request, missing amount
 *       404:
 *         description: Order not found
 */
router.post('/:id/abonos', checkOrderOwnership, async (req, res) => {
  const { id: pedido_id } = req.params;
  const { amount, payment_method, notes } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'The "amount" field is required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('abonos')
      .insert([{ pedido_id, amount, payment_method, notes }])
      .select();

    if (error) {
      console.error('Error adding payment:', error);
      return res.status(500).json({ error: 'Failed to add payment.' });
    }
    
    // TODO: In a future step, after adding a payment, we should recalculate
    // the total paid amount and potentially update the parent order's 'payment_status'.

    res.status(201).json({ message: 'Payment added successfully', payment: data[0] });
  } catch (err) {
    console.error('Exception while adding payment:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;