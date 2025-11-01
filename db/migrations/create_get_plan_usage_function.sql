-- Function to get the usage stats for payment plans

CREATE OR REPLACE FUNCTION public.get_payment_plan_usage(p_user_id UUID)
RETURNS TABLE (
    plan_name TEXT,
    usage_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Create a descriptive name for the payment plan
        CASE
            WHEN p.plan_tipo = 'contado' THEN 'Contado'
            WHEN p.plan_tipo = 'cuotas' THEN
                INITCAP(p.plan_frecuencia) || ' - ' || p.plan_cuotas || ' cuota' || CASE WHEN p.plan_cuotas > 1 THEN 's' ELSE '' END
            ELSE 'No especificado'
        END AS plan_name,
        COUNT(*) AS usage_count
    FROM
        public.pedidos p
    WHERE
        p.user_id = p_user_id
        AND p.plan_tipo IS NOT NULL
    GROUP BY
        plan_name
    ORDER BY
        usage_count DESC;
END;
$$ LANGUAGE plpgsql;
