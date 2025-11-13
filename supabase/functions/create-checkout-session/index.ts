
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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
    const requestBody = await req.json()
    const { cartItems, totalAmount, shippingInfo, giftOptions, metadata = {} } = requestBody

    // Enhanced input validation and sanitization
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Invalid cart items provided')
    }

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      throw new Error('Invalid total amount provided')
    }

    console.log('📥 Request validated:', {
      itemCount: cartItems.length,
      totalAmount,
      hasShipping: !!shippingInfo,
      hasGiftOptions: !!giftOptions,
      metadata
    })

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Enhanced user authentication with UUID validation
    let user = null
    let validatedUserId = null
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
        
        // Validate UUID format for user.id
        if (user?.id) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (uuidRegex.test(user.id)) {
            validatedUserId = user.id
            console.log('✅ Valid user authenticated:', validatedUserId)
          } else {
            console.warn('⚠️ Invalid UUID format for user.id:', user.id)
            user = null
          }
        }
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
        user_id: validatedUserId || 'guest',
        order_type: 'marketplace',
        gift_options: giftOptions ? JSON.stringify({
          isGift: !!giftOptions.isGift,
          scheduleDelivery: !!giftOptions.scheduleDelivery,
          sendGiftMessage: !!giftOptions.sendGiftMessage,
          scheduledDeliveryDate: giftOptions.scheduledDeliveryDate || null,
          // Enhanced package-level scheduling support
          packages: giftOptions.packages || []
        }) : '{}',
        delivery_groups: cartItems ? JSON.stringify(
          cartItems
            .filter(item => item.recipientAssignment?.deliveryGroupId)
            .reduce((groups, item) => {
              const groupId = item.recipientAssignment.deliveryGroupId;
              if (!groups[groupId]) {
                groups[groupId] = {
                  recipientId: item.recipientAssignment.connectionId,
                  recipientName: item.recipientAssignment.connectionName,
                  scheduledDeliveryDate: item.recipientAssignment.scheduledDeliveryDate,
                  items: []
                };
              }
              groups[groupId].items.push(item.product.product_id);
              return groups;
            }, {})
        ) : '{}',
        ...metadata
      }
    })

    // Create order in database with enhanced validation
    if (user && validatedUserId) {
      try {
        // Sanitize and validate gift options
        const sanitizedGiftOptions = {
          isGift: !!giftOptions?.isGift,
          scheduleDelivery: !!giftOptions?.scheduleDelivery,
          sendGiftMessage: !!giftOptions?.sendGiftMessage,
          isSurpriseGift: !!giftOptions?.isSurpriseGift,
          giftMessage: giftOptions?.giftMessage ? String(giftOptions.giftMessage).substring(0, 1000) : null,
          scheduledDeliveryDate: giftOptions?.scheduledDeliveryDate || null
        }

        console.log('💾 Creating order with sanitized data:', {
          userId: validatedUserId,
          sessionId: session.id,
          giftOptions: sanitizedGiftOptions
        })

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: validatedUserId,
            subtotal: Math.round((totalAmount - (giftOptions?.giftingFee || 0)) * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100,
            status: 'pending',
            payment_status: 'pending',
            stripe_session_id: session.id,
            shipping_info: shippingInfo || null,
            gift_message: sanitizedGiftOptions.giftMessage,
            is_gift: sanitizedGiftOptions.isGift,
            scheduled_delivery_date: sanitizedGiftOptions.scheduledDeliveryDate,
            is_surprise_gift: sanitizedGiftOptions.isSurpriseGift,
            gift_scheduling_options: {
              scheduleDelivery: sanitizedGiftOptions.scheduleDelivery,
              sendGiftMessage: sanitizedGiftOptions.sendGiftMessage,
              isSurpriseGift: sanitizedGiftOptions.isSurpriseGift
            },
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (orderError) {
          console.error('❌ Order creation failed:', orderError)
          throw new Error(`Failed to create order: ${orderError.message}`)
        }

        if (order) {
          console.log('✅ Order created successfully:', order.id)
          
          // Create order items with validation
          const orderItems = cartItems?.map((item: any) => {
            // Validate product data
            if (!item.product?.product_id) {
              throw new Error('Invalid product data: missing product_id')
            }
            
            return {
              order_id: order.id,
              product_id: String(item.product.product_id).substring(0, 255),
              product_name: String(item.product.name || item.product.title || 'Unknown Product').substring(0, 255),
              product_image: item.product.image ? String(item.product.image).substring(0, 500) : null,
              vendor: item.product.vendor ? String(item.product.vendor).substring(0, 255) : null,
              quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
              unit_price: Math.round((Number(item.product.price) || 0) * 100) / 100,
              total_price: Math.round((Number(item.product.price) || 0) * Math.max(1, Math.floor(Number(item.quantity) || 1)) * 100) / 100
            }
          }) || []

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

          if (itemsError) {
            console.error('⚠️ Order items creation failed:', itemsError)
            // Don't fail the entire request, just log the error
          } else {
            console.log('✅ Order items created successfully')
          }
        }
      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError)
        // Continue with checkout session creation even if order creation fails
        console.log('⚠️ Continuing with guest checkout flow')
      }
    } else if (user && !validatedUserId) {
      console.warn('⚠️ User authentication failed UUID validation, proceeding as guest')
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
