-- Function to get the top products by total revenue

CREATE OR REPLACE FUNCTION public.get_top_products_by_revenue(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
    product_name TEXT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (product_data->>'name')::TEXT AS product_name,
        SUM((product_data->>'price')::NUMERIC * (product_data->>'quantity')::INT) AS total_revenue
    FROM
        public.pedidos,
        -- Un-nest the JSONB array of products into individual records
        jsonb_to_recordset(pedidos.order_content->'products') AS product_data(name TEXT, price NUMERIC, quantity INT)
    WHERE
        pedidos.user_id = p_user_id
    GROUP BY
        product_name
    ORDER BY
        total_revenue DESC
    LIMIT
        p_limit;
END;
$$ LANGUAGE plpgsql;
