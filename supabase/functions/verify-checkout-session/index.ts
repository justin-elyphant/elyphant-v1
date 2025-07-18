
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
    const { session_id } = await req.json()

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status === 'paid') {
      // Update order status in database
      const { data: order, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', session.payment_intent)
        .select('id, order_number, shipping_info, gift_message, is_gift, scheduled_delivery_date, is_surprise_gift')
        .single()

      if (updateError && !updateError.message.includes('No rows')) {
        console.error('Error updating order:', updateError)
        throw new Error('Failed to update order status')
      }

      // Trigger Zinc order processing after successful payment
      if (order) {
        try {
          // Get order items for Zinc processing
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', order.id)

          if (itemsError) {
            console.error('Error fetching order items:', itemsError)
          } else {
            // Call process-zinc-order function
            const { data: zincResult, error: zincError } = await supabase.functions.invoke('process-zinc-order', {
              body: {
                orderRequest: {
                  retailer: "amazon",
                  products: orderItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                  })),
                  shipping_address: {
                    first_name: order.shipping_info.name?.split(' ')[0] || '',
                    last_name: order.shipping_info.name?.split(' ').slice(1).join(' ') || '',
                    address_line1: order.shipping_info.address,
                    address_line2: order.shipping_info.line2 || '',
                    zip_code: order.shipping_info.zipCode,
                    city: order.shipping_info.city,
                    state: order.shipping_info.state,
                    country: order.shipping_info.country,
                    phone_number: '555-0123'
                  },
                  billing_address: {
                    first_name: order.shipping_info.name?.split(' ')[0] || '',
                    last_name: order.shipping_info.name?.split(' ').slice(1).join(' ') || '',
                    address_line1: order.shipping_info.address,
                    address_line2: order.shipping_info.line2 || '',
                    zip_code: order.shipping_info.zipCode,
                    city: order.shipping_info.city,
                    state: order.shipping_info.state,
                    country: order.shipping_info.country,
                    phone_number: '555-0123'
                  },
                  payment_method: {
                    name_on_card: order.shipping_info.name,
                    number: '4111111111111111',
                    expiration_month: 12,
                    expiration_year: 2025,
                    security_code: '123'
                  },
                  is_gift: order.is_gift,
                  gift_message: order.gift_message,
                  delivery_date_preference: order.scheduled_delivery_date,
                  delivery_instructions: order.is_surprise_gift ? 'This is a surprise gift - please ensure discreet packaging' : undefined,
                  is_test: false
                },
                orderId: order.id,
                paymentIntentId: session.payment_intent
              }
            })

            if (zincError) {
              console.error('Zinc processing failed:', zincError)
              // Don't fail the payment verification, just log the error
            } else {
              console.log('Zinc processing initiated successfully for order:', order.id)
            }
          }
        } catch (zincError) {
          console.error('Error initiating Zinc processing:', zincError)
          // Don't fail the payment verification, just log the error
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          order_number: order?.order_number,
          payment_status: session.payment_status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          payment_status: session.payment_status,
          error: 'Payment not completed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }
  } catch (error) {
    console.error('Error verifying checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
