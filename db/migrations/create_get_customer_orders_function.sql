-- Function to get a specific customer's orders with detailed payment status

CREATE OR REPLACE FUNCTION public.get_customer_orders_with_details(p_user_id UUID, p_customer_id BIGINT)
RETURNS TABLE (
    -- All columns from the 'pedidos' table
    id BIGINT,
    store_id BIGINT,
    user_id UUID,
    customer_info JSONB,
    order_content JSONB,
    total_amount NUMERIC,
    payment_status TEXT,
    delivery_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    plan_tipo TEXT,
    plan_frecuencia TEXT,
    plan_cuotas INTEGER,
    
    -- New calculated fields
    total_abonado NUMERIC,
    saldo_pendiente NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.*,
        COALESCE(SUM(a.amount), 0) AS total_abonado,
        p.total_amount - COALESCE(SUM(a.amount), 0) AS saldo_pendiente
    FROM 
        public.pedidos p
    LEFT JOIN 
        public.abonos a ON p.id = a.pedido_id
    WHERE 
        p.user_id = p_user_id AND p.cliente_id = p_customer_id
    GROUP BY
        p.id
    ORDER BY
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
