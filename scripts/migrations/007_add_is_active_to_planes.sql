ALTER TABLE planes
ADD COLUMN is_active BOOLEAN DEFAULT true;

COMMENT ON COLUMN planes.is_active IS 'Indica si el plan está activo y puede ser asignado a nuevos contratos.';

-- Opcional: Marcar los planes existentes como activos por defecto
UPDATE planes SET is_active = true WHERE is_active IS NULL;
