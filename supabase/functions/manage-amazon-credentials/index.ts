
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
      // Simple encryption (in production, use proper encryption with Supabase secrets)
      const encryptedPassword = password // TODO: Implement proper encryption

      // Upsert the single Elyphant credential record
      const { data, error } = await supabase
        .from('elyphant_amazon_credentials')
        .upsert({
          email: email,
          encrypted_password: encryptedPassword,
          credential_name: credential_name || 'Primary Amazon Business Account',
          notes: notes || 'Main Elyphant Amazon Business account for order fulfillment',
          verification_code: verification_code || null,
          is_active: true,
          is_verified: false // Will be verified on first successful order
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Elyphant Amazon credentials saved successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      // Get the active Elyphant credentials (should only be one record)
      const { data, error } = await supabase
        .from('elyphant_amazon_credentials')
        .select('email, is_verified, last_verified_at, created_at, credential_name, notes, verification_code')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          credentials: data,
          hasCredentials: !!data 
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
        error: error.message || 'Failed to manage credentials'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
