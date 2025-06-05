
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, email, password } = await req.json()

    if (action === 'save') {
      // Simple encryption (in production, use proper encryption with Supabase secrets)
      const encryptedPassword = password // TODO: Implement proper encryption

      // Upsert credentials
      const { data, error } = await supabase
        .from('amazon_business_credentials')
        .upsert({
          user_id: user.id,
          email: email,
          encrypted_password: encryptedPassword,
          is_active: true,
          is_verified: false // Will be verified on first successful order
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Credentials saved successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { data, error } = await supabase
        .from('amazon_business_credentials')
        .select('email, is_verified, last_verified_at, created_at')
        .eq('user_id', user.id)
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
      const { error } = await supabase
        .from('amazon_business_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Credentials removed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error managing Amazon credentials:', error)
    
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
