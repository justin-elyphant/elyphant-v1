
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, isTestMode = false } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Processing Zinc order for order ${orderId}, test mode: ${isTestMode}`);

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
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log(`Processing Zinc order for user ${order.user_id}, order ${orderId}`);

    // Get Elyphant Amazon credentials (try active first, then any available)
    let { data: credentials, error: credError } = await supabaseClient
      .from('elyphant_amazon_credentials')
      .select('*')
      .eq('is_active', true)
      .single();

    // If no active credentials, get any available credentials
    if (credError && credError.code === 'PGRST116') {
      const { data: fallbackCreds, error: fallbackError } = await supabaseClient
        .from('elyphant_amazon_credentials')
        .select('*')
        .limit(1)
        .single();
      
      credentials = fallbackCreds;
      credError = fallbackError;
    }

    if (credError || !credentials) {
      console.error('Amazon credentials error:', credError);
      throw new Error(`Amazon credentials not configured: ${credError?.message}`);
    }

    console.log(`Using Amazon credentials: ${credentials.email} (verified: ${credentials.is_verified})`);
    
    if (!credentials.is_verified && !isTestMode) {
      console.warn('Amazon credentials not verified, but proceeding with order');
    }

    // Prepare Zinc order data
    const shippingAddress = order.shipping_info;
    
    // Parse name field into first and last name
    const nameParts = (shippingAddress.name || "").split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Name";
    
    const orderData = {
      retailer: "amazon",
      products: order.order_items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address_line1: shippingAddress.address || shippingAddress.address_line1,
        address_line2: shippingAddress.addressLine2 || shippingAddress.address_line2 || "",
        zip_code: shippingAddress.zipCode || shippingAddress.zip_code,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: "US"
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address_line1: shippingAddress.address || shippingAddress.address_line1,
        address_line2: shippingAddress.addressLine2 || shippingAddress.address_line2 || "",
        zip_code: shippingAddress.zipCode || shippingAddress.zip_code,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: "US"
      },
      payment_method: {
        use_gift: false
      },
      is_gift: order.is_gift || false,
      gift_message: order.gift_message || "",
      is_test: isTestMode, // Use the passed test mode flag
      retailer_credentials: {
        email: credentials.email,
        password: credentials.encrypted_password,
        verification_code: credentials.verification_code || "639146"
      }
    };

    console.log("Order data:", JSON.stringify(orderData, null, 2));
    console.log("Sending request to Zinc API...");

    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    console.log("Enhanced order request with Elyphant Amazon credentials prepared");

    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${zincApiKey}:`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    console.log(`Zinc API response status: ${zincResponse.status} ${zincResponse.statusText}`);

    if (zincResponse.ok) {
      const zincOrder = await zincResponse.json();
      console.log("Zinc order processed successfully:", zincOrder.request_id);

      // Update our order with Zinc order ID and initial status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          zinc_order_id: zincOrder.request_id,
          zinc_status: 'placed',
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with Zinc ID:', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        zincOrderId: zincOrder.request_id,
        orderId: orderId,
        testMode: isTestMode
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      const errorResponse = await zincResponse.text();
      console.error('Zinc API error:', errorResponse);
      
      // Update order status to failed
      await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
          zinc_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      throw new Error(`Zinc API error: ${errorResponse}`);
    }

  } catch (error) {
    console.error('🚨 Error processing Zinc order:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
