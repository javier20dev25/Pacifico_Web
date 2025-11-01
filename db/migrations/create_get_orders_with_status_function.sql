-- Function to get orders with a calculated 'is_overdue' status

CREATE OR REPLACE FUNCTION public.get_orders_with_status(p_user_id UUID)
RETURNS TABLE (
    -- Re-declare all columns from the 'pedidos' table to define the return type
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
    -- Add the new calculated field
    is_overdue BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH order_payment_counts AS (
        -- First, count the number of payments made for each order
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
        -- Start calculating the is_overdue flag
        CASE
            -- An order is never overdue if it's fully paid or cancelled.
            WHEN p.payment_status = 'pagado' OR p.delivery_status = 'cancelado' THEN FALSE
            
            -- Logic for 'contado' (cash) plans. Overdue if not paid after 7 days.
            WHEN p.plan_tipo = 'contado' AND p.payment_status <> 'pagado' AND NOW() > p.created_at + INTERVAL '7 days' THEN TRUE

            -- Logic for 'cuotas' (installments) plans.
            WHEN p.plan_tipo = 'cuotas' AND p.plan_cuotas > 0 THEN
                (
                    -- Calculate how many payments SHOULD have been made by now
                    CASE
                        WHEN p.plan_frecuencia = 'semanal' THEN floor(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 604800)
                        WHEN p.plan_frecuencia = 'quincenal' THEN floor(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 1209600)
                        WHEN p.plan_frecuencia = 'mensual' THEN floor(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 2592000)
                        ELSE 0
                    END
                ) > opc.payments_made
            
            -- Default case: not overdue
            ELSE FALSE
        END AS is_overdue
    FROM public.pedidos p
    -- Join with the payment counts
    JOIN order_payment_counts opc ON p.id = opc.order_id
    WHERE p.user_id = p_user_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
