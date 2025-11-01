const express = require('express');
const router = express.Router();
const {supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

// Proteger todas las rutas de este archivo
router.use(protect);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers for the user
 *     responses:
 *       200:
 *         description: A list of customers
 */
router.get('/', async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('user_id', user_id)
      .order('name', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers.', details: err.message });
  }
});

/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Search for customers
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: A list of matching customers
 */
router.get('/search', async (req, res) => {
  const user_id = req.user.id;
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query \'q\' is required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('user_id', user_id)
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search customers.', details: err.message });
  }
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string' }
 *               phone: { type: 'string' }
 *               email: { type: 'string' }
 *               address: { type: 'string' }
 *               notes: { type: 'string' }
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Bad request or duplicate customer
 */
router.post('/', async (req, res) => {
  const user_id = req.user.id;
  const { name, phone, email, address, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is a required field.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .insert([{ user_id, name, phone, email, address, notes }])
      .select();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') { // PostgreSQL unique violation code
        return res.status(409).json({ error: 'A customer with this name and phone number already exists.' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Customer created successfully', customer: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer.', details: err.message });
  }
});


/**
 * @swagger
 * /api/customers/{customerId}/orders:
 *   get:
 *     summary: Get order history for a specific customer
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: A list of orders for the customer
 */
router.get('/:customerId/orders', async (req, res) => {
  const user_id = req.user.id;
  const { customerId } = req.params;

  if (!customerId || isNaN(parseInt(customerId))) {
    return res.status(400).json({ error: 'A valid customer ID is required.' });
  }

  try {
    // Call the new RPC function that gets orders and calculates payment details
    const { data, error } = await supabaseAdmin.rpc('get_customer_orders_with_details', {
      p_user_id: user_id,
      p_customer_id: parseInt(customerId, 10)
    });

    if (error) throw error;

    // The RPC function returns an empty array if customer not found or no orders, which is correct.
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer orders.', details: err.message });
  }
});

module.exports = router;