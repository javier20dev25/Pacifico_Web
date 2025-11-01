-- Añade campos estructurados para planes de pago a la tabla de pedidos

ALTER TABLE public.pedidos
ADD COLUMN plan_tipo TEXT, -- Puede ser 'contado' o 'cuotas'
ADD COLUMN plan_frecuencia TEXT, -- Puede ser 'semanal', 'quincenal', 'mensual'
ADD COLUMN plan_cuotas INTEGER; -- Número de cuotas, ej: 3, 6, 12

-- Añadir restricciones para asegurar la integridad de los datos
ALTER TABLE public.pedidos
ADD CONSTRAINT chk_plan_tipo CHECK (plan_tipo IN ('contado', 'cuotas', NULL)),
ADD CONSTRAINT chk_plan_frecuencia CHECK (plan_frecuencia IN ('semanal', 'quincenal', 'mensual', NULL));

COMMENT ON COLUMN public.pedidos.plan_tipo IS 'Define si el pago es único (contado) o en cuotas.';
COMMENT ON COLUMN public.pedidos.plan_frecuencia IS 'La frecuencia de las cuotas (semanal, quincenal, mensual).';
COMMENT ON COLUMN public.pedidos.plan_cuotas IS 'El número total de cuotas para el plan.';
