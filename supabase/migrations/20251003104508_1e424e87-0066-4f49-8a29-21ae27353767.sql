-- Enforce that sensitive credentials MUST be stored in Vault, not in table columns
-- This is a defense-in-depth security measure

-- First, ensure any existing credentials are nulled out (cleanup)
UPDATE public.integrations 
SET api_key = NULL, webhook_secret = NULL 
WHERE api_key IS NOT NULL OR webhook_secret IS NOT NULL;

-- Add CHECK constraints to enforce NULL values for sensitive fields
-- This makes it impossible to store credentials in the database table
ALTER TABLE public.integrations
  ADD CONSTRAINT api_key_must_be_null CHECK (api_key IS NULL),
  ADD CONSTRAINT webhook_secret_must_be_null CHECK (webhook_secret IS NULL);

-- Add comments explaining the security design
COMMENT ON COLUMN public.integrations.api_key IS 'DEPRECATED: Must always be NULL. Use Supabase Vault via get_integration_credentials() function instead.';
COMMENT ON COLUMN public.integrations.webhook_secret IS 'DEPRECATED: Must always be NULL. Use Supabase Vault via get_integration_credentials() function instead.';
COMMENT ON COLUMN public.integrations.credentials_in_vault IS 'Indicates that credentials are securely stored in Supabase Vault.';

-- Update the existing RLS policies to add audit logging context
COMMENT ON POLICY "Admins can view integrations metadata" ON public.integrations IS 'Admins can view integration metadata. Sensitive credentials (api_key, webhook_secret) are enforced to be NULL via CHECK constraints and must be accessed via get_integration_credentials() function.';
