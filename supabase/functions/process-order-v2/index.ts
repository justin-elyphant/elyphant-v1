import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

    // Fetch profile email/name/phone for fallback (shopper's phone as backup for gift recipients)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name, shipping_address')
      .eq('id', order.user_id)
      .single();

    // Extract shopper's phone for fallback when recipient phone is missing
    const shopperPhone = profile?.shipping_address?.phone || '';

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
    
    // Handle both old (flat array) and new (nested object) formats
    let itemsArray: any[];
    if (Array.isArray(lineItems)) {
      // Old format: flat array of items
      itemsArray = lineItems;
      console.log('📦 Using legacy flat array format for line_items');
    } else if (lineItems && typeof lineItems === 'object' && lineItems.items) {
      // New format: nested object with items array
      itemsArray = lineItems.items;
      console.log('📦 Using new nested format for line_items');
    } else {
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

    if (!itemsArray || itemsArray.length === 0) {
      console.error('❌ Empty line_items array');
      await markOrderRequiresAttention(
        supabase, 
        orderId, 
        'Empty line items array'
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

    console.log(`✅ Found ${itemsArray.length} line items`);

    // STEP 4.5: RECIPIENT-FIRST ADDRESS PRIORITY
    // For gift orders, extract shipping from line_items.recipient_shipping
    // This ensures gifts ship to recipient, not sender (per unified pipeline architecture)
    let shippingAddress = order.shipping_address;
    let recipientPhone = '';
    let isGiftOrder = false;
    let recipientName = '';

    const firstItem = itemsArray[0];
    if (firstItem?.recipient_id && firstItem?.recipient_shipping) {
      const rs = firstItem.recipient_shipping;
      isGiftOrder = true;
      recipientName = firstItem.recipient_name || rs.name || '';
      recipientPhone = rs.phone || '';
      
      // Build recipient shipping address with field normalization
      shippingAddress = {
        name: rs.name || recipientName,
        address_line1: rs.address_line1 || rs.street || rs.address || '',
        address_line2: rs.address_line2 || rs.addressLine2 || '',
        city: rs.city || '',
        state: rs.state || '',
        postal_code: rs.postal_code || rs.zipCode || rs.zip_code || '',
        country: rs.country || 'US',
        phone: rs.phone || '',
      };
      
      console.log(`🎁 [RECIPIENT-FIRST] Gift order detected → Using recipient shipping`);
      console.log(`   📍 Recipient: ${recipientName} in ${shippingAddress.city}, ${shippingAddress.state}`);
    } else {
      console.log(`📦 [SELF-PURCHASE] Using order.shipping_address (buyer)`);
    }

    // STEP 5: Validate shipping address (from JSONB column or recipient data)
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
    const invalidProducts = itemsArray.filter((item: any) => {
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

    console.log(`✅ All ${itemsArray.length} product IDs validated as Amazon ASINs`);

    // STEP 6.5: Validate phone number (CRITICAL for Zinc/carrier delivery notifications)
    // Priority: recipient phone (for gifts) > shipping address phone > shopper profile phone
    const finalPhoneNumber = recipientPhone || shippingAddress.phone || shopperPhone || '';
    if (!finalPhoneNumber) {
      console.warn(`⚠️ [PHONE] No phone number for order ${orderId} - Zinc may reject for carrier notifications`);
      // Log to orders table for admin visibility
      await supabase.from('orders').update({
        notes: (order.notes ? order.notes + ' | ' : '') + 'Warning: No phone number provided - may affect delivery notifications'
      }).eq('id', orderId);
    } else {
      console.log(`✅ [PHONE] Phone number present for carrier notifications: ${finalPhoneNumber.substring(0, 3)}***`);
    }

    // STEP 7: Build Zinc ZMA API request
    // ZMA (Zinc Managed Accounts) uses Zinc's Amazon credentials
    // Determine gift status: explicit from line item OR from gift_options
    const hasGiftMessage = !!(order.gift_options?.giftMessage || firstItem?.gift_message);
    const effectiveIsGift = isGiftOrder || hasGiftMessage;
    const giftMessageContent = firstItem?.gift_message || order.gift_options?.giftMessage || '';
    
    const zincRequest = {
      addax: true, // CRITICAL: Enables ZMA processing
      idempotency_key: orderId,
      retailer: 'amazon',
      products: itemsArray.map((item: any) => ({
        product_id: item.product_id || item.productId || item.id,
        quantity: item.quantity || 1,
      })),
      // Hybrid max_price: use product subtotal (what Amazon charges) with 20% buffer + $15 fixed shipping/tax allowance
      // This handles cheap items where shipping can be 50%+ of product cost
      max_price: Math.ceil((order.line_items?.subtotal || order.total_amount) * 100 * 1.20) + 1500,
      shipping_address: {
        first_name: requiredShippingFields.name.split(' ')[0] || requiredShippingFields.name,
        last_name: requiredShippingFields.name.split(' ').slice(1).join(' ') || '',
        address_line1: requiredShippingFields.address_line1,
        address_line2: shippingAddress.address_line2 || '',
        zip_code: requiredShippingFields.postal_code,
        city: requiredShippingFields.city,
        state: requiredShippingFields.state,
        country: shippingAddress.country || 'US',
        phone_number: finalPhoneNumber,  // Use validated phone from step 6.5
      },
      is_gift: effectiveIsGift,
      gift_message: effectiveIsGift && giftMessageContent
        ? `${giftMessageContent}\n\nFrom: ${profile?.name || 'A Friend'}`
        : null,
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

    // STEP 7.5: Pre-flight ZMA balance check
    // This prevents order failures by checking if we have sufficient ZMA funds before submitting to Zinc
    console.log('💰 Checking ZMA balance before Zinc submission...');
    
    const { data: zmaAccount, error: zmaError } = await supabase
      .from('zma_accounts')
      .select('account_balance, id')
      .eq('is_default', true)
      .single();

    if (zmaError) {
      console.log('⚠️ Could not fetch ZMA balance, proceeding with order:', zmaError.message);
    }

    const currentZmaBalance = zmaAccount?.account_balance || 0;
    const estimatedCost = order.total_amount * 1.30; // 30% buffer for Zinc markup
    const ZMA_SAFETY_MARGIN = 50; // $50 safety margin
    const minRequiredBalance = estimatedCost + ZMA_SAFETY_MARGIN;

    console.log(`📊 ZMA Balance: $${currentZmaBalance.toFixed(2)} | Required: $${minRequiredBalance.toFixed(2)}`);

    if (zmaAccount && currentZmaBalance < minRequiredBalance) {
      console.log(`⏳ ZMA balance insufficient: $${currentZmaBalance.toFixed(2)} < $${minRequiredBalance.toFixed(2)} required`);
      
      // Calculate expected funding date (next 5th of month or 5 days from now)
      const now = new Date();
      const expectedFundingDate = new Date(now);
      if (now.getDate() <= 5) {
        expectedFundingDate.setDate(5);
      } else {
        expectedFundingDate.setMonth(expectedFundingDate.getMonth() + 1);
        expectedFundingDate.setDate(5);
      }
      
      // Update order to awaiting_funds status
      await supabase.from('orders').update({
        status: 'awaiting_funds',
        funding_status: 'awaiting_funds',
        funding_hold_reason: `ZMA balance ($${currentZmaBalance.toFixed(2)}) insufficient for order ($${estimatedCost.toFixed(2)} needed with buffer)`,
        expected_funding_date: expectedFundingDate.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);

      // Queue admin alert email
      await supabase.from('email_queue').insert({
        recipient_email: 'admin@elyphant.ai',
        event_type: 'zma_low_balance_alert',
        template_variables: {
          current_balance: currentZmaBalance,
          order_amount: estimatedCost,
          order_id: orderId,
          order_number: order.order_number,
          required_amount: minRequiredBalance,
        },
        status: 'pending',
        priority: 'high',
      });

      // Record alert if not recently sent
      const { data: recentAlert } = await supabase
        .from('zma_funding_alerts')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq('alert_type', currentZmaBalance < 500 ? 'critical_balance' : 'low_balance')
        .maybeSingle();

      if (!recentAlert) {
        await supabase.from('zma_funding_alerts').insert({
          alert_type: currentZmaBalance < 500 ? 'critical_balance' : 'low_balance',
          zma_current_balance: currentZmaBalance,
          pending_orders_value: estimatedCost,
          recommended_transfer_amount: minRequiredBalance - currentZmaBalance,
          orders_count_waiting: 1,
          email_sent: true,
        });
      }

      console.log(`⚠️ Order ${orderId} held - awaiting ZMA funds`);

      return new Response(
        JSON.stringify({ 
          success: false,
          awaiting_funds: true,
          message: 'Order held - insufficient ZMA balance',
          zma_balance: currentZmaBalance,
          required: minRequiredBalance,
          expected_funding_date: expectedFundingDate.toISOString(),
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`✅ ZMA balance check passed: $${currentZmaBalance.toFixed(2)} > $${minRequiredBalance.toFixed(2)}`);

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

    // NOTE: Order confirmation email is sent by stripe-webhook-v2, not here
    // This prevents duplicate emails (webhook sends on order creation, before Zinc processing)
    console.log('📧 Order confirmation email handled by stripe-webhook-v2');

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
