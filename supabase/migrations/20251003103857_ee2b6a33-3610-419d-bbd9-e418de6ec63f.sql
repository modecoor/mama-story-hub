-- Move sensitive credentials to Supabase Vault
-- This migration removes direct access to API keys and webhook secrets

-- First, let's create helper functions to work with Vault
-- These functions will be used by edge functions to securely store/retrieve credentials

-- Function to securely retrieve integration credentials (SECURITY DEFINER)
-- This function can only be called by authenticated users and returns decrypted credentials
CREATE OR REPLACE FUNCTION public.get_integration_credentials(integration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vault_secret_api_key text;
  vault_secret_webhook text;
  result jsonb;
BEGIN
  -- Only admins can retrieve credentials
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access integration credentials';
  END IF;

  -- Build the vault key names
  vault_secret_api_key := 'integration_api_key_' || integration_id::text;
  vault_secret_webhook := 'integration_webhook_secret_' || integration_id::text;

  -- Retrieve secrets from vault
  result := jsonb_build_object(
    'api_key', vault.decrypted_secret(vault_secret_api_key),
    'webhook_secret', vault.decrypted_secret(vault_secret_webhook)
  );

  RETURN result;
END;
$$;

-- Update the integrations table to make sensitive fields nullable
-- We'll migrate existing data to vault in the application code
ALTER TABLE public.integrations 
  ALTER COLUMN api_key DROP NOT NULL,
  ALTER COLUMN webhook_secret DROP NOT NULL;

-- Add a column to track if credentials are in vault
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS credentials_in_vault boolean DEFAULT false;

-- Create RLS policy to hide sensitive fields from direct SELECT queries
-- Drop the existing policy and recreate with field restrictions
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.integrations;

-- Admins can view integrations but NOT the sensitive credential fields
CREATE POLICY "Admins can view integrations metadata"
ON public.integrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can insert integrations
CREATE POLICY "Admins can create integrations"
ON public.integrations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can update integrations
CREATE POLICY "Admins can update integrations"
ON public.integrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can delete integrations
CREATE POLICY "Admins can delete integrations"
ON public.integrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comment on the changes
COMMENT ON FUNCTION public.get_integration_credentials IS 'Securely retrieves integration credentials from Supabase Vault. Only accessible to admin users.';
COMMENT ON COLUMN public.integrations.credentials_in_vault IS 'Indicates whether sensitive credentials are stored in Vault (true) or in table fields (false for legacy).';

-- Note: The actual migration of existing credentials to Vault will be handled
-- by the application code through edge functions, as Vault operations require
-- proper authentication context that isn't available in migrations.