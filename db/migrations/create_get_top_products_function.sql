-- Function to get the most ordered products for a user

CREATE OR REPLACE FUNCTION public.get_top_products(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
    product_name TEXT,
    total_quantity BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (product_data->>'name')::TEXT AS product_name,
        SUM((product_data->>'quantity')::BIGINT) AS total_quantity
    FROM
        public.pedidos,
        -- Un-nest the JSONB array of products into individual records
        jsonb_to_recordset(pedidos.order_content->'products') AS product_data(name TEXT, quantity INT)
    WHERE
        pedidos.user_id = p_user_id
    GROUP BY
        product_name
    ORDER BY
        total_quantity DESC
    LIMIT
        p_limit;
END;
$$ LANGUAGE plpgsql;
