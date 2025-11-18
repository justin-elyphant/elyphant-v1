import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let orderId: string | null = null;

  try {
    const body = await req.json();
    orderId = body.orderId;
    
    console.log('📦 process-order-v2: Starting processing for order', orderId);

    if (!orderId) {
      throw new Error('Missing orderId in request body');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // STEP 1: Fetch order with all required data
    console.log('🔍 Fetching order details...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderId);
      throw new Error(`Order not found: ${orderId}`);
    }

    console.log(`✅ Order found: ${order.order_number} | Status: ${order.status} | Payment: ${order.payment_status}`);

    // Fetch profile email/name for fallback
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', order.user_id)
      .single();

    // STEP 2: Validate payment status
    if (order.payment_status !== 'paid' && order.payment_status !== 'authorized') {
      console.error(`❌ Payment not confirmed: ${order.payment_status}`);
      throw new Error(`Order payment not confirmed: ${order.payment_status}`);
    }

    // STEP 3: Check if already submitted to Zinc
    if (order.zinc_order_id) {
      console.log(`⚠️ Order already submitted to Zinc: ${order.zinc_order_id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order already processing',
          zinc_order_id: order.zinc_order_id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // STEP 4: Extract line_items from JSONB column
    const lineItems = order.line_items;
    
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      console.error('❌ No line_items found in order');
      await markOrderRequiresAttention(
        supabase, 
        orderId, 
        'No line items found in order data'
      );
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No line items found',
          requires_attention: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`✅ Found ${lineItems.length} line items`);

    // STEP 5: Extract and validate shipping address (from JSONB column)
    const shippingAddress = order.shipping_address;
    
    if (!shippingAddress) {
      console.error('❌ No shipping_address found in order');
      await markOrderRequiresAttention(
        supabase, 
        orderId, 
        'No shipping address found in order data'
      );
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No shipping address',
          requires_attention: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // CRITICAL: Accept both postal_code (preferred) and zip_code (legacy)
    const zipCode = shippingAddress.postal_code || shippingAddress.zip_code || shippingAddress.zipCode;
    
    console.log('🔍 Validating shipping address fields...');
    const requiredShippingFields = {
      name: shippingAddress.name,
      address_line1: shippingAddress.address_line1 || shippingAddress.address || shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postal_code: zipCode,
    };

    const missingFields = Object.entries(requiredShippingFields)
      .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      console.error('❌ Incomplete shipping address:', missingFields);
      console.error('📦 Shipping address data:', JSON.stringify(shippingAddress, null, 2));
      
      await markOrderRequiresAttention(
        supabase, 
        orderId, 
        `Incomplete shipping address. Missing: ${missingFields.join(', ')}`
      );
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Incomplete shipping address',
          missing_fields: missingFields,
          requires_attention: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`✅ Shipping address validated: ${requiredShippingFields.city}, ${requiredShippingFields.state} ${requiredShippingFields.postal_code}`);

    // STEP 6: Validate product IDs are Amazon ASINs (not Stripe IDs)
    console.log('🔍 Validating product IDs...');
    const invalidProducts = lineItems.filter((item: any) => {
      const productId = item.product_id || item.productId || item.id;
      // Amazon ASINs are typically 10 characters starting with B0
      const isValidAsin = productId && (
        /^B0[A-Z0-9]{8}$/i.test(productId) || // Standard ASIN format
        /^[A-Z0-9]{10}$/i.test(productId)      // Alternative format
      );
      return !isValidAsin;
    });

    if (invalidProducts.length > 0) {
      console.error('❌ Invalid product IDs detected (not Amazon ASINs):', 
        invalidProducts.map((item: any) => ({
          title: item.title,
          product_id: item.product_id || item.productId || item.id
        }))
      );
      
      await markOrderRequiresAttention(
        supabase, 
        orderId, 
        `Invalid product IDs: Expected Amazon ASINs but got: ${invalidProducts.map((i: any) => i.product_id || i.productId || i.id).join(', ')}`
      );
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid product IDs - expected Amazon ASINs',
          invalid_products: invalidProducts,
          requires_attention: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`✅ All ${lineItems.length} product IDs validated as Amazon ASINs`);

    // STEP 7: Build Zinc ZMA API request
    // ZMA (Zinc Managed Accounts) uses Zinc's Amazon credentials
    const zincRequest = {
      addax: true, // CRITICAL: Enables ZMA processing
      idempotency_key: orderId,
      retailer: 'amazon',
      products: lineItems.map((item: any) => ({
        product_id: item.product_id || item.productId || item.id,
        quantity: item.quantity || 1,
      })),
      max_price: Math.ceil(order.total_amount * 1.1),
      shipping_address: {
        first_name: requiredShippingFields.name.split(' ')[0] || requiredShippingFields.name,
        last_name: requiredShippingFields.name.split(' ').slice(1).join(' ') || '',
        address_line1: requiredShippingFields.address_line1,
        address_line2: shippingAddress.address_line2 || '',
        zip_code: requiredShippingFields.postal_code,
        city: requiredShippingFields.city,
        state: requiredShippingFields.state,
        country: shippingAddress.country || 'US',
      },
      is_gift: order.is_auto_gift || false,
      gift_message: order.gift_message || undefined,
      shipping_method: 'cheapest',
      // NOTE: payment_method, retailer_credentials, and billing_address 
      // MUST BE OMITTED for ZMA orders per Zinc documentation
      webhooks: {
        request_succeeded: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`,
        request_failed: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`,
        tracking_obtained: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`,
        tracking_updated: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`,
        status_updated: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`,
        case_updated: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`,
      },
      addax_queue_timeout: 14400, // 4 hours queue timeout
      client_notes: {
        order_id: orderId,
        order_number: order.order_number,
        user_id: order.user_id,
      },
    };

    console.log('🔵 Zinc API request prepared');
    console.log('📦 Products:', zincRequest.products.length);
    console.log('📍 Shipping to:', `${zincRequest.shipping_address.city}, ${zincRequest.shipping_address.state}`);

    // STEP 8: Submit to Zinc API
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    console.log('🚀 Submitting to Zinc API...');
    console.log('📦 Product IDs being sent to Zinc:', 
      zincRequest.products.map((p: any) => `${p.product_id} (qty: ${p.quantity})`).join(', ')
    );
    
    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
      },
      body: JSON.stringify(zincRequest),
    });

    const zincData = await zincResponse.json();

    if (!zincResponse.ok) {
      console.error('❌ Zinc API error:', zincData);
      
      await supabase
        .from('orders')
        .update({
          status: 'requires_attention',
          funding_hold_reason: `Zinc API error: ${zincData.message || 'Unknown error'}`,
          zinc_error: zincData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      throw new Error(`Zinc API error: ${zincData.message || 'Unknown error'}`);
    }

    const zincRequestId = zincData.request_id;
    console.log(`✅ Zinc ZMA order submitted! Request ID: ${zincRequestId}`);

    // STEP 9: Update order with Zinc details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        zinc_request_id: zincRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Failed to update order after Zinc submission:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`✅ Order ${orderId} updated to processing status`);

    // STEP 10: Queue order confirmation email with fallback
    try {
      console.log('📧 Queueing order confirmation email...');
      
      // Derive email with fallback chain
      const toEmail = order.shipping_address?.email || order.customer_email || profile?.email || null;
      const recipientName = requiredShippingFields.name || profile?.name || 'Customer';
      
      console.log(`[email-queue] toEmail=${toEmail} order=${order.order_number}`);
      
      if (!toEmail) {
        console.warn(`⚠️ No recipient email for ${order.order_number} – skipping email queue`);
      } else {
        const { error: emailError } = await supabase
          .from('email_queue')
          .insert({
            recipient_email: toEmail,
            recipient_name: recipientName,
            event_type: 'order_confirmation',
            template_variables: {
              order_number: order.order_number,
              order_id: orderId,
              customer_name: recipientName,
              total_amount: order.total_amount,
              currency: order.currency || 'USD',
            },
            priority: 'high',
            scheduled_for: new Date().toISOString(),
            status: 'pending',
          });

        if (emailError) {
          console.error('⚠️ Failed to queue confirmation email:', emailError);
          // Don't fail the order if email queue fails
        } else {
          console.log('✅ Order confirmation email queued');
          
          // Auto-kick email queue processor (dev helper - non-blocking)
          try {
            await supabase.functions.invoke('process-email-queue?force=true');
            console.log('[email-queue] Auto-kicked email processor');
          } catch (kickError) {
            console.log('[email-queue] Auto-kick failed (non-blocking):', kickError?.message || kickError);
          }
        }
      }
    } catch (emailErr) {
      console.error('⚠️ Error queueing confirmation email:', emailErr);
      // Don't fail the order if email queue fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_id: orderId,
        zinc_request_id: zincRequestId,
        message: 'Order submitted to Zinc successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ process-order-v2 error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        order_id: orderId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function markOrderRequiresAttention(
  supabase: any,
  orderId: string,
  reason: string
) {
  console.log(`⚠️ Marking order ${orderId} as requires_attention: ${reason}`);
  
  await supabase
    .from('orders')
    .update({
      status: 'requires_attention',
      funding_hold_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}
