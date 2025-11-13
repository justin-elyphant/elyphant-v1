import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { paymentMethodId, makeDefault = false } = await req.json()
    
    console.log('🔵 Saving payment method:', {
      paymentMethodId,
      makeDefault,
      timestamp: new Date().toISOString()
    })

    // Create Supabase client with service role for secure operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Initialize Stripe to get payment method details
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Retrieve payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    if (!paymentMethod.card) {
      throw new Error('Invalid payment method - not a card')
    }

    // If making this the default, first set all existing payment methods to non-default
    if (makeDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    // Save payment method to database
    const { data: savedMethod, error: saveError } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        stripe_payment_method_id: paymentMethodId,
        last_four: paymentMethod.card.last4,
        card_type: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        is_default: makeDefault
      })
      .select()
      .single()

    if (saveError) {
      throw new Error(`Failed to save payment method: ${saveError.message}`)
    }

    console.log('✅ Payment method saved successfully:', {
      id: savedMethod.id,
      last_four: savedMethod.last_four,
      card_type: savedMethod.card_type,
      is_default: savedMethod.is_default
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        paymentMethod: savedMethod
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : undefined
    console.error('❌ Error saving payment method:', {
      error: errMessage,
      stack: errStack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ error: errMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})