CREATE OR REPLACE FUNCTION get_top_customers(p_user_id UUID, p_limit INT)
RETURNS TABLE(customer_name TEXT, total_spent NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.name,
        SUM(p.total_amount) as total_spent
    FROM
        public.pedidos AS p
    JOIN
        public.clientes AS c ON p.cliente_id = c.id
    WHERE
        p.user_id = p_user_id
    GROUP BY
        c.id, c.name
    ORDER BY
        total_spent DESC
    LIMIT
        p_limit;
END;
$$;
