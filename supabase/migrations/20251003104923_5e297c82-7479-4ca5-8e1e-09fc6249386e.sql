-- Remove deprecated credential columns entirely
-- These columns were enforced to be NULL via CHECK constraints
-- All credentials are now stored securely in Supabase Vault
-- Removing the columns eliminates the security scanner warning

-- Drop the CHECK constraints first
ALTER TABLE public.integrations
  DROP CONSTRAINT IF EXISTS api_key_must_be_null,
  DROP CONSTRAINT IF EXISTS webhook_secret_must_be_null;

-- Drop the deprecated columns
ALTER TABLE public.integrations
  DROP COLUMN IF EXISTS api_key,
  DROP COLUMN IF EXISTS webhook_secret;

-- Update the comment to reflect the new design
COMMENT ON TABLE public.integrations IS 'Stores integration metadata. All sensitive credentials (API keys, webhook secrets) are stored in Supabase Vault and accessed via get_integration_credentials() function.';
COMMENT ON COLUMN public.integrations.credentials_in_vault IS 'When true, credentials are securely stored in Supabase Vault.';
COMMENT ON COLUMN public.integrations.endpoint_url IS 'Public endpoint URL (not sensitive). Sensitive credentials must be stored in Vault.';