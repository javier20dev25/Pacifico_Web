-- Function to get customers who have overdue orders (yellow list)

CREATE OR REPLACE FUNCTION public.get_customers_with_overdue_orders(p_user_id UUID)
RETURNS TABLE (
    customer_id BIGINT,
    customer_name TEXT,
    overdue_orders_count BIGINT,
    total_overdue_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH overdue_orders AS (
        -- First, get all overdue orders using the existing function
        SELECT *
        FROM public.get_orders_with_status(p_user_id)
        WHERE is_overdue = TRUE
    )
    -- Now, group by customer and aggregate the results
    SELECT
        c.id AS customer_id,
        c.name AS customer_name,
        COUNT(o.id) AS overdue_orders_count,
        SUM(o.total_amount - o.total_abonado) AS total_overdue_amount
    FROM
        overdue_orders o
    JOIN
        public.clientes c ON o.cliente_id = c.id
    WHERE
        c.user_id = p_user_id
    GROUP BY
        c.id, c.name
    ORDER BY
        total_overdue_amount DESC;
END;
$$ LANGUAGE plpgsql;
