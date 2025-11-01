const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { protect } = require('../middleware/auth');

router.use(protect);

/**
 * @swagger
 * /api/stats/summary:
 *   get:
 *     summary: Get a summary of statistics for the user
 *     description: Retrieves key stats like total orders, customers, and revenue.
 *     responses:
 *       200:
 *         description: A summary of statistics
 */
router.get('/summary', async (req, res) => {
  const user_id = req.user.id;

  try {
    // Usar Promise.all para ejecutar las consultas en paralelo
    const [
      { count: totalOrders, error: ordersError },
      { count: totalCustomers, error: customersError },
      { data: revenueData, error: revenueError },
    ] = await Promise.all([
      supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('user_id', user_id),
      supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('user_id', user_id),
      supabase.from('pedidos').select('total_amount').eq('user_id', user_id).eq('payment_status', 'pagado'),
    ]);

    if (ordersError || customersError || revenueError) {
      console.error({ ordersError, customersError, revenueError });
      throw new Error('Failed to fetch parts of the summary.');
    }

    const totalRevenue = revenueData.reduce((sum, order) => sum + order.total_amount, 0);

    res.status(200).json({
      totalOrders: totalOrders || 0,
      totalCustomers: totalCustomers || 0,
      totalRevenue: totalRevenue || 0,
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statistics summary.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/orders-by-status:
 *   get:
 *     summary: Get order counts by delivery status.
 *     responses:
 *       200:
 *         description: An array of objects with status and count.
 */
router.get('/orders-by-status', async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase.rpc('get_orders_by_status', {
      p_user_id: user_id
    });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order status statistics.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/monthly-financials:
 *   get:
 *     summary: Get monthly revenue and pending amounts.
 *     responses:
 *       200:
 *         description: An array of objects with month, total_revenue, and total_pending.
 */
router.get('/monthly-financials', async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase.rpc('get_financial_summary_by_month', {
      p_user_id: user_id
    });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly financial statistics.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/top-customers:
 *   get:
 *     summary: Get top customers by total amount spent.
 *     description: Retrieves a list of top customers based on their total spending.
 *     responses:
 *       200:
 *         description: An array of top customers with their total spending.
 */
router.get('/top-customers', async (req, res) => {
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit || '5', 10); // Allow limit to be configurable, default to 5

  try {
    const { data, error } = await supabase.rpc('get_top_customers', {
      p_user_id: user_id,
      p_limit: limit
    });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top customers.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/top-products:
 *   get:
 *     summary: Get top products by quantity sold.
 *     description: Retrieves a list of top products based on their total quantity sold across all orders.
 *     responses:
 *       200:
 *         description: An array of top products with their total quantity.
 */
router.get('/top-products', async (req, res) => {
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit || '5', 10);

  try {
    const { data, error } = await supabase.rpc('get_top_products', {
      p_user_id: user_id,
      p_limit: limit
    });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top products.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/fastest-payers:
 *   get:
 *     summary: Get fastest paying customers.
 *     description: Retrieves a list of customers who pay their orders the fastest on average.
 *     responses:
 *       200:
 *         description: An array of fastest paying customers with their average payment duration.
 */
router.get('/fastest-payers', async (req, res) => {
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit || '5', 10);

  try {
    const { data, error } = await supabase.rpc('get_fastest_paying_customers', {
      p_user_id: user_id,
      p_limit: limit
    });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fastest paying customers.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/plan-usage:
 *   get:
 *     summary: Get payment plan usage statistics.
 *     description: Retrieves the count of how many times each payment plan is used.
 *     responses:
 *       200:
 *         description: An array of payment plans and their usage counts.
 */
router.get('/plan-usage', async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase.rpc('get_payment_plan_usage', {
      p_user_id: user_id
    });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment plan usage.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/yellow-list-customers:
 *   get:
 *     summary: Get customers with overdue orders.
 *     description: Retrieves a list of customers who have one or more overdue orders.
 *     responses:
 *       200:
 *         description: An array of customers with their overdue order count and total overdue amount.
 */
router.get('/yellow-list-customers', async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase.rpc('get_customers_with_overdue_orders', {
      p_user_id: user_id
    });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch yellow list customers.', details: err.message });
  }
});

/**
 * @swagger
 * /api/stats/top-products-by-revenue:
 *   get:
 *     summary: Get top products by total revenue.
 *     description: Retrieves a list of top products based on their total revenue generated.
 *     responses:
 *       200:
 *         description: An array of top products with their total revenue.
 */
router.get('/top-products-by-revenue', async (req, res) => {
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit || '5', 10);

  try {
    const { data, error } = await supabase.rpc('get_top_products_by_revenue', {
      p_user_id: user_id,
      p_limit: limit
    });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top products by revenue.', details: err.message });
  }
});

module.exports = router;
