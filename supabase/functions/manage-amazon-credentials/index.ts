
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // This endpoint is now admin-only - no user authentication required
    // Only the service role can access elyphant_amazon_credentials
    
    const { action, email, password, credential_name, notes, verification_code } = await req.json()

    if (action === 'save') {
      console.log(`💾 Saving credentials for email: ${email}`);
      
      // Simple encryption (in production, use proper encryption with Supabase secrets)
      const encryptedPassword = password; // TODO: Implement proper encryption
      
      // First, deactivate all existing credentials to ensure only one active
      const { error: deactivateError } = await supabase
        .from('elyphant_amazon_credentials')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true);

      if (deactivateError) {
        console.error('❌ Error deactivating existing credentials:', deactivateError);
      } else {
        console.log('✅ Successfully deactivated existing credentials');
      }

      // Now insert new credentials
      const { data, error } = await supabase
        .from('elyphant_amazon_credentials')
        .insert({
          email,
          encrypted_password: encryptedPassword,
          credential_name: credential_name || 'Primary Amazon Business Account',
          notes: notes || 'Main Elyphant Amazon Business account for order fulfillment',
          verification_code: verification_code || null,
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving credentials:', error);
        throw error;
      }

      console.log(`✅ Successfully saved new credentials for: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Elyphant Amazon credentials saved successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      // Get the active Elyphant credentials (get the most recent one if multiple exist)
      const { data, error } = await supabase
        .from('elyphant_amazon_credentials')
        .select('email, is_verified, last_verified_at, created_at, credential_name, notes, verification_code')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching credentials:', error);
        throw error;
      }

      const credentials = data && data.length > 0 ? data[0] : null;

      return new Response(
        JSON.stringify({ 
          success: true, 
          credentials: credentials,
          hasCredentials: !!credentials 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      // Deactivate the Elyphant credentials
      const { error } = await supabase
        .from('elyphant_amazon_credentials')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Elyphant Amazon credentials deactivated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error managing Elyphant Amazon credentials:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Failed to manage credentials')
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
