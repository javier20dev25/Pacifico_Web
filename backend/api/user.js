const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

// ==========================================================
// 1. OBTENER PERFIL DE USUARIO
// ==========================================================
router.get('/profile', protect, async (req, res) => {
    try {
        const userUuid = req.user.uuid; 

        const { data: userProfile, error } = await supabaseAdmin
            .from('vw_usuarios_planes')
            .select('*')
            .eq('usuario_uuid', userUuid)
            .single();

        if (error || !userProfile) {
            return res.status(404).json({ error: 'Perfil de usuario no encontrado.' });
        }

        res.json(userProfile);

    } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ==========================================================
// 2. OBTENER TIENDAS DEL USUARIO
// ==========================================================
router.get('/stores', protect, async (req, res) => {
    try {
        const userUuid = req.user.uuid;

        const { data: stores, error } = await supabaseAdmin
            .from('stores')
            .select('id, data')
            .eq('user_id', userUuid);

        if (error) { throw error; }

        res.json(stores);

    } catch (error) {
        console.error('Error al obtener las tiendas del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar tiendas.' });
    }
});

// ==========================================================
// 3. GUARDAR UN NUEVO PEDIDO
// ==========================================================
router.post('/orders', protect, async (req, res) => {
    try {
        const userUuid = req.user.uuid;
        const { customer_name, order_date, products, total_price, total_weight, raw_message } = req.body;

        // Validación básica
        if (!customer_name || !order_date || !products || !raw_message) {
            return res.status(400).json({ error: 'Faltan datos requeridos para guardar el pedido.' });
        }

        const { data, error } = await supabaseAdmin
            .from('pedidos') // Usando la tabla 'pedidos' que definimos
            .insert([{
                user_id: userUuid,
                customer_name,
                order_date,
                products,
                total_price,
                total_weight,
                raw_message
            }])
            .select();

        if (error) { throw error; }

        res.status(201).json(data);

    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor al guardar el pedido.' });
    }
});


module.exports = router;
