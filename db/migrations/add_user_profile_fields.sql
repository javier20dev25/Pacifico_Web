-- db/migrations/add_user_profile_fields.sql

ALTER TABLE public.usuarios
ADD COLUMN username TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN gender TEXT;

-- Opcional: Añadir una restricción para los valores de género
ALTER TABLE public.usuarios
ADD CONSTRAINT chk_gender_valid CHECK (gender IN ('hombre', 'mujer', 'otro', 'prefiero_no_decirlo', NULL));

-- Opcional: Crear un índice en username si se va a usar para búsquedas frecuentes
-- CREATE INDEX idx_usuarios_username ON public.usuarios (username);