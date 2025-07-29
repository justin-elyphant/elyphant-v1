import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 ZMA Function started');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, isTestMode = false, debugMode = false, cardholderName } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`🔍 Processing ZMA order for order ${orderId}, test mode: ${isTestMode}`);

    // Get order details from database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`❌ Order not found: ${orderError?.message}`);
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log(`📋 Processing ZMA order for user ${order.user_id}, order ${orderId}`);

    // Update billing info if provided (for retry scenarios)
    if (cardholderName) {
      console.log(`💳 Updating billing info with cardholder name: ${cardholderName}`);
      const updatedBillingInfo = {
        ...order.billing_info,
        cardholderName: cardholderName
      };
      
      const { error: billingUpdateError } = await supabaseClient
        .from('orders')
        .update({
          billing_info: updatedBillingInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (billingUpdateError) {
        console.error('❌ Error updating billing info:', billingUpdateError);
      } else {
        order.billing_info = updatedBillingInfo;
        console.log('✅ Billing info updated successfully');
      }
    }

    // Get default ZMA account
    console.log("🔐 Fetching ZMA account...");
    const { data: zmaAccounts, error: zmaError } = await supabaseClient
      .from('zma_accounts')
      .select('*')
      .eq('is_default', true);

    console.log("🔐 ZMA query result:", { accountCount: zmaAccounts?.length, zmaError });

    if (zmaError) {
      console.error("❌ ZMA query error:", zmaError);
      throw new Error(`ZMA account query failed: ${zmaError.message}`);
    }

    if (!zmaAccounts || zmaAccounts.length === 0) {
      console.error("❌ No default ZMA account found");
      throw new Error('No default ZMA account configured');
    }

    const zmaAccount = zmaAccounts[0];
    console.log(`🔐 Using ZMA account: ${zmaAccount.account_name} (Balance: $${zmaAccount.account_balance})`);

    // Prepare ZMA order data
    const shippingAddress = order.shipping_info;
    const billingInfo = order.billing_info;
    
    // Parse shipping name into first and last name
    const shippingNameParts = (shippingAddress.name || "").split(" ");
    const shippingFirstName = shippingNameParts[0] || "Customer";
    const shippingLastName = shippingNameParts.slice(1).join(" ") || "Name";
    
    // Use billing info if available, otherwise fall back to shipping
    const cardholderNameToUse = billingInfo?.cardholderName || shippingAddress.name || "Customer Name";
    const billingNameParts = cardholderNameToUse.split(" ");
    const billingFirstName = billingNameParts[0] || "Customer";
    const billingLastName = billingNameParts.slice(1).join(" ") || "Name";
    
    // Simple order payload for ZMA (PriceYak)
    const orderData = {
      retailer: "amazon",
      products: order.order_items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      shipping_address: {
        first_name: shippingFirstName,
        last_name: shippingLastName,
        address_line1: shippingAddress.address || shippingAddress.address_line1,
        address_line2: shippingAddress.addressLine2 || shippingAddress.address_line2 || "",
        zip_code: shippingAddress.zipCode || shippingAddress.zip_code,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: "US"
      },
      billing_address: {
        first_name: billingFirstName,
        last_name: billingLastName,
        address_line1: shippingAddress.address || shippingAddress.address_line1,
        address_line2: shippingAddress.addressLine2 || shippingAddress.address_line2 || "",
        zip_code: shippingAddress.zipCode || shippingAddress.zip_code,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: "US"
      },
      is_gift: order.is_gift || false,
      gift_message: order.gift_message || "",
      is_test: isTestMode
    };

    console.log("📦 ZMA order data prepared:", {
      retailer: orderData.retailer,
      productCount: orderData.products.length,
      isGift: orderData.is_gift,
      isTest: orderData.is_test,
      zmaAccount: zmaAccount.account_name
    });

    console.log("📡 Sending request to ZMA API...");

    const requestStartTime = Date.now();
    const zmaResponse = await fetch('https://api.priceyak.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zmaAccount.api_key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Elyphant-ZMA-OrderProcessor/1.0'
      },
      body: JSON.stringify(orderData)
    });

    const requestDuration = Date.now() - requestStartTime;
    console.log(`⏱️ ZMA API response received in ${requestDuration}ms - Status: ${zmaResponse.status} ${zmaResponse.statusText}`);

    if (zmaResponse.ok) {
      const zmaOrder = await zmaResponse.json();
      console.log("✅ ZMA order processed successfully:", zmaOrder.request_id || zmaOrder.id);
      
      const zmaOrderId = zmaOrder.request_id || zmaOrder.id;

      // Update our order with ZMA order ID and initial status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          zma_order_id: zmaOrderId,
          zma_account_used: zmaAccount.account_name,
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Error updating order with ZMA ID:', updateError);
      }

      // Log successful order processing
      await supabaseClient
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `ZMA order successfully submitted. ZMA Order ID: ${zmaOrderId}. Account: ${zmaAccount.account_name}. Test mode: ${isTestMode}. Response time: ${requestDuration}ms.`,
          note_type: 'system',
          is_internal: true
        });

      return new Response(JSON.stringify({
        success: true,
        zmaOrderId: zmaOrderId,
        orderId: orderId,
        testMode: isTestMode,
        processingTime: requestDuration,
        zmaAccount: zmaAccount.account_name,
        nextSteps: 'Order submitted to ZMA. Status will be updated automatically via background checks.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      const errorResponse = await zmaResponse.text();
      console.error(`❌ ZMA API error (${zmaResponse.status}):`, errorResponse);
      
      // Log the error details
      await supabaseClient
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `ZMA order submission failed. Status: ${zmaResponse.status}. Error: ${errorResponse}. Account: ${zmaAccount.account_name}. Test mode: ${isTestMode}.`,
          note_type: 'error',
          is_internal: true
        });
      
      // Update order status to failed
      await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      throw new Error(`ZMA API error (${zmaResponse.status}): ${errorResponse}`);
    }

  } catch (error) {
    console.error('🚨 Error processing ZMA order:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});