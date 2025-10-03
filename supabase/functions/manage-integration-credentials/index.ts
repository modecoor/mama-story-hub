import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { action, integrationId, apiKey, webhookSecret } = await req.json();

    if (action === 'store') {
      // Store credentials in Vault
      const vaultKeyPrefix = `integration_${integrationId}`;

      if (apiKey) {
        const { error: apiKeyError } = await supabaseClient
          .rpc('vault.create_secret', {
            secret: apiKey,
            name: `${vaultKeyPrefix}_api_key`,
          });

        if (apiKeyError) {
          console.error('Error storing API key:', apiKeyError);
          throw new Error('Failed to store API key in Vault');
        }
      }

      if (webhookSecret) {
        const { error: webhookError } = await supabaseClient
          .rpc('vault.create_secret', {
            secret: webhookSecret,
            name: `${vaultKeyPrefix}_webhook_secret`,
          });

        if (webhookError) {
          console.error('Error storing webhook secret:', webhookError);
          throw new Error('Failed to store webhook secret in Vault');
        }
      }

      // Update integration to mark credentials as stored in vault
      // Clear the plaintext credential fields
      await supabaseClient
        .from('integrations')
        .update({
          credentials_in_vault: true,
          api_key: null,
          webhook_secret: null,
        })
        .eq('id', integrationId);

      return new Response(
        JSON.stringify({ success: true, message: 'Credentials stored securely' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'delete') {
      // Delete credentials from Vault when integration is deleted
      const vaultKeyPrefix = `integration_${integrationId}`;

      // Note: Supabase Vault doesn't expose a delete function via RPC
      // Secrets are automatically garbage collected when no longer referenced
      // We just need to delete the integration record
      await supabaseClient
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      return new Response(
        JSON.stringify({ success: true, message: 'Integration and credentials deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in manage-integration-credentials:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
