
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZincOrderRequest {
  retailer: string;
  products: { product_id: string; quantity: number }[];
  shipping_address: any;
  billing_address: any;
  payment_method: any;
  shipping_method?: string;
  is_gift?: boolean;
  gift_message?: string;
  delivery_instructions?: string;
  delivery_date_preference?: string;
  is_test: boolean;
}

interface ProcessOrderParams {
  orderRequest: ZincOrderRequest;
  orderId: string;
  paymentIntentId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { orderRequest, orderId, paymentIntentId }: ProcessOrderParams = await req.json()

    console.log(`Processing Zinc order for user ${user.id}, order ${orderId}`)

    // Get Elyphant's centralized Amazon Business credentials
    const { data: credentialsArray, error: credError } = await supabase
      .from('elyphant_amazon_credentials')
      .select('email, encrypted_password, verification_code, is_verified')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)

    const credentials = credentialsArray && credentialsArray.length > 0 ? credentialsArray[0] : null;

    if (credError || !credentials) {
      console.log('No Elyphant Amazon Business credentials found')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Elyphant Amazon Business credentials not configured. Please contact support.',
          requiresAdminSetup: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simple decryption (in production, use proper encryption)
    const decryptedPassword = credentials.encrypted_password

    // Add Elyphant's Amazon credentials to the order request
    const enhancedOrderRequest = {
      ...orderRequest,
      retailer_credentials: {
        email: credentials.email,
        password: decryptedPassword,
        ...(credentials.verification_code && { verification_code: credentials.verification_code })
      }
    }

    console.log('Enhanced order request with Elyphant Amazon credentials prepared')

    // Process order through Zinc API
    const zincApiKey = Deno.env.get('ZINC_API_KEY')
    if (!zincApiKey) {
      throw new Error('Zinc API key not configured')
    }

    console.log('Sending request to Zinc API...')
    console.log('Order data:', JSON.stringify(enhancedOrderRequest, null, 2))
    
    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedOrderRequest),
    })
    
    console.log('Zinc API response status:', zincResponse.status, zincResponse.statusText)

    let zincResult = null
    let zincError = null

    if (zincResponse.ok) {
      zincResult = await zincResponse.json()
      console.log('Zinc order processed successfully:', zincResult.request_id)

      // Update order record with Zinc details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          zinc_order_id: zincResult.request_id,
          zinc_status: 'processing',
          status: 'processing'
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order with Zinc details:', updateError)
      }

      // Mark credentials as verified on successful order
      await supabase
        .from('elyphant_amazon_credentials')
        .update({ 
          is_verified: true,
          last_verified_at: new Date().toISOString()
        })
        .eq('is_active', true)

    } else {
      const errorData = await zincResponse.json()
      zincError = errorData
      console.error('Zinc API error:', errorData)

      // Check for credential-related errors
      if (errorData.code === 'invalid_credentials' || errorData.message?.includes('credentials')) {
        // Mark Elyphant credentials as unverified
        await supabase
          .from('elyphant_amazon_credentials')
          .update({ is_verified: false })
          .eq('is_active', true)

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Elyphant Amazon Business credentials are invalid. Please contact support.',
            invalidCredentials: true
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // For other errors, still update order but mark as failed
      await supabase
        .from('orders')
        .update({
          zinc_status: 'failed',
          status: 'payment_confirmed' // Keep as payment confirmed since payment succeeded
        })
        .eq('id', orderId)
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        zincOrderId: zincResult?.request_id || null,
        zincStatus: zincResult ? 'processing' : 'failed',
        message: zincResult ? 'Order sent to fulfillment successfully' : 'Order placed but fulfillment may be delayed'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing Zinc order:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process order'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
