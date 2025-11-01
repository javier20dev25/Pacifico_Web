-- Updates the get_orders_with_status function to include the store_name

CREATE OR REPLACE FUNCTION public.get_orders_with_status(p_user_id UUID)
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
    -- Calculated field
    is_overdue BOOLEAN,
    -- NEW field from JOIN
    store_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH order_payment_counts AS (
        SELECT
            p.id as order_id,
            COUNT(a.id) as payments_made
        FROM public.pedidos p
        LEFT JOIN public.abonos a ON p.id = a.pedido_id
        WHERE p.user_id = p_user_id
        GROUP BY p.id
    )
    SELECT
        p.*, -- Select all columns from the pedidos table
        -- Calculate is_overdue flag
        CASE
            WHEN p.payment_status = 'pagado' OR p.delivery_status = 'cancelado' THEN FALSE
            WHEN p.plan_tipo = 'contado' AND p.payment_status <> 'pagado' AND NOW() > p.created_at + INTERVAL '7 days' THEN TRUE
            WHEN p.plan_tipo = 'cuotas' AND p.plan_cuotas > 0 THEN
                (
                    CASE
                        WHEN p.plan_frecuencia = 'semanal' THEN floor(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 604800)
                        WHEN p.plan_frecuencia = 'quincenal' THEN floor(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 1209600)
                        WHEN p.plan_frecuencia = 'mensual' THEN floor(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 2592000)
                        ELSE 0
                    END
                ) > opc.payments_made
            ELSE FALSE
        END AS is_overdue,
        -- NEW: Get the store name from the JSONB data field
        s.data->>'store_name' AS store_name
    FROM public.pedidos p
    JOIN order_payment_counts opc ON p.id = opc.order_id
    -- NEW: Join with stores table
    LEFT JOIN public.stores s ON p.store_id = s.id
    WHERE p.user_id = p_user_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
