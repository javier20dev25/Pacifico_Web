CREATE OR REPLACE FUNCTION get_financial_summary_by_month(p_user_id UUID)
RETURNS TABLE(month TEXT, total_revenue NUMERIC, total_pending NUMERIC)
LANGUAGE sql
AS $$
    WITH monthly_orders AS (
        SELECT
            to_char(p.created_at, 'YYYY-MM') as month_text,
            p.id,
            p.total_amount,
            p.payment_status
        FROM pedidos p
        WHERE p.user_id = p_user_id
    ),
    payments AS (
        SELECT
            a.pedido_id,
            SUM(a.amount) as total_paid
        FROM abonos a
        -- Unir con pedidos para asegurar que solo contamos pagos del usuario correcto
        JOIN pedidos p ON a.pedido_id = p.id
        WHERE p.user_id = p_user_id
        GROUP BY a.pedido_id
    )
    SELECT
        mo.month_text,
        SUM(CASE WHEN mo.payment_status = 'pagado' THEN mo.total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN mo.payment_status != 'pagado' THEN mo.total_amount - COALESCE(py.total_paid, 0) ELSE 0 END) as total_pending
    FROM monthly_orders mo
    LEFT JOIN payments py ON mo.id = py.pedido_id
    GROUP BY mo.month_text
    ORDER BY mo.month_text;
$$;
