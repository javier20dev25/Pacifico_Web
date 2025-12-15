-- MIGRATION SCRIPT 005
-- Adds a "name" column to the riel_preregistrations table to capture the user's name during pre-registration.

ALTER TABLE public.riel_preregistrations
ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN public.riel_preregistrations.name IS 'The name of the user who is pre-registering for a Riel account.';
