-- MIGRATION SCRIPT
-- Adds a UNIQUE constraint to the whatsapp_number column in the riel_preregistrations table.
-- This is necessary for the UPSERT logic in the /api/riel/preregister endpoint to work correctly.

ALTER TABLE public.riel_preregistrations
ADD CONSTRAINT riel_preregistrations_whatsapp_number_key UNIQUE (whatsapp_number);

-- Adding a comment for clarity in the database schema.
COMMENT ON CONSTRAINT riel_preregistrations_whatsapp_number_key ON public.riel_preregistrations IS 'Ensures that each WhatsApp number can only be pre-registered once.';
