-- Function to get the fastest paying customers

CREATE OR REPLACE FUNCTION public.get_fastest_paying_customers(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
    customer_id BIGINT,
    customer_name TEXT,
    avg_payment_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    WITH paid_orders_duration AS (
        -- First, calculate the payment duration for each fully paid order
        SELECT
            p.cliente_id,
            -- The duration is the time between creation and the last update (when it was marked as paid)
            (p.updated_at - p.created_at) AS payment_duration
        FROM
            public.pedidos p
        WHERE
            p.user_id = p_user_id
            AND p.payment_status = 'pagado'
            -- Ensure there was a time difference to calculate
            AND p.updated_at > p.created_at
    )
    -- Now, calculate the average duration for each customer
    SELECT
        c.id AS customer_id,
        c.name AS customer_name,
        AVG(pod.payment_duration) AS avg_payment_duration
    FROM
        paid_orders_duration pod
    JOIN
        public.clientes c ON pod.cliente_id = c.id
    WHERE
        c.user_id = p_user_id
    GROUP BY
        c.id, c.name
    HAVING
        AVG(pod.payment_duration) IS NOT NULL
    ORDER BY
        avg_payment_duration ASC -- Fastest first
    LIMIT
        p_limit;
END;
$$ LANGUAGE plpgsql;
