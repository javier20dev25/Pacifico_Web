-- 1) Añadir columna slug si no existe
ALTER TABLE IF EXISTS public.stores
  ADD COLUMN IF NOT EXISTS slug text;

-- 2) Generar slug a partir de nombre (para filas existentes)
UPDATE public.stores
SET slug = LOWER(
             regexp_replace(
               regexp_replace(nombre, '[^a-zA-Z0-9]+', '-', 'g'),
             '(^-+|-+$)', '', 'g')
           )
WHERE slug IS NULL OR slug = '';

-- 3) Resolver duplicados: para slugs repetidos, añadir -<id>
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) rn
  FROM public.stores
)
UPDATE public.stores s
SET slug = s.slug || '-' || s.id::text
FROM duplicates d
WHERE s.id = d.id AND d.rn > 1;

-- 4) Crear índice único para velocidad y seguridad
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'stores_slug_idx' AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX stores_slug_idx ON public.stores (slug);
  END IF;
END$$;

-- 5) (Opcional pero recomendado) crear función y trigger para auto-generar slug en inserts/updates
CREATE OR REPLACE FUNCTION public.generate_store_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.nombre, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));
  ELSE
    NEW.slug := lower(regexp_replace(NEW.slug, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '(^-+|-+$)', '', 'g');
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_generate_store_slug'
  ) THEN
    CREATE TRIGGER trg_generate_store_slug
      BEFORE INSERT OR UPDATE ON public.stores
      FOR EACH ROW
      EXECUTE FUNCTION public.generate_store_slug();
  END IF;
END;
$$;
