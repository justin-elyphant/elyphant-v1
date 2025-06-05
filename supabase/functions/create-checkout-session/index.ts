
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { cartItems, totalAmount, shippingInfo, giftOptions, metadata = {} } = await req.json()

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    let user = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      try {
        const userClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )
        const token = authHeader.replace('Bearer ', '')
        const { data } = await userClient.auth.getUser(token)
        user = data.user
      } catch (error) {
        console.warn('Failed to get user, proceeding with guest checkout:', error)
      }
    }

    // Create line items from cart data
    const lineItems = cartItems?.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name || item.product.title,
          images: item.product.image ? [item.product.image] : [],
          metadata: {
            product_id: item.product.product_id,
            vendor: item.product.vendor || ''
          }
        },
        unit_amount: Math.round((item.product.price || 0) * 100)
      },
      quantity: item.quantity
    })) || []

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: user?.email || undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU']
      },
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment-cancel`,
      metadata: {
        user_id: user?.id || 'guest',
        order_type: 'marketplace',
        ...metadata
      }
    })

    // Create order in database
    if (user) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          subtotal: totalAmount - (giftOptions?.giftingFee || 0),
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
          stripe_session_id: session.id,
          shipping_info: shippingInfo,
          gift_message: giftOptions?.giftMessage || null,
          is_gift: giftOptions?.isGift || false,
          scheduled_delivery_date: giftOptions?.scheduledDeliveryDate || null,
          is_surprise_gift: giftOptions?.isSurpriseGift || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!orderError && order) {
        // Create order items
        const orderItems = cartItems?.map((item: any) => ({
          order_id: order.id,
          product_id: item.product.product_id,
          product_name: item.product.name || item.product.title,
          product_image: item.product.image,
          vendor: item.product.vendor,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity
        })) || []

        await supabase
          .from('order_items')
          .insert(orderItems)
      }
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
