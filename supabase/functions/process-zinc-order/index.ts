
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

    const { orderId, isTestMode = false, debugMode = false } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`🚀 Processing Zinc order for order ${orderId}, test mode: ${isTestMode}, debug mode: ${debugMode}`);

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

    console.log(`📋 Processing Zinc order for user ${order.user_id}, order ${orderId}`);
    if (debugMode) {
      console.log(`🐛 Full order data:`, JSON.stringify(order, null, 2));
    }

    // Get Amazon credentials with explicit ordering and validation
    console.log("🔐 Fetching Amazon credentials...");
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('elyphant_amazon_credentials')
      .select('email, encrypted_password, credential_name, is_verified, verification_code, totp_2fa_key')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (credentialsError || !credentials) {
      console.error("❌ No active Amazon credentials found:", credentialsError);
      throw new Error('No active Amazon credentials configured');
    }

    // Validate and log credential details (without password)
    console.log(`🔐 Using Amazon credentials: ${credentials.email} (${credentials.credential_name || 'Unknown'}), Verified: ${credentials.is_verified}`);
    
    if (!credentials.email || !credentials.encrypted_password) {
      console.error("❌ Invalid credentials structure:", { 
        hasEmail: !!credentials.email, 
        hasPassword: !!credentials.encrypted_password 
      });
      throw new Error('Invalid Amazon credentials structure');
    }

    // Get default business payment method
    let businessPaymentMethod = null;
    try {
      const { data: paymentMethodResponse, error: pmError } = await supabaseClient
        .functions.invoke('manage-business-payment-methods', {
          body: { action: 'getDefault' }
        });

      if (pmError) {
        console.error('❌ Error fetching business payment method:', pmError);
      } else if (paymentMethodResponse?.success && paymentMethodResponse?.data) {
        businessPaymentMethod = paymentMethodResponse.data;
        console.log(`💳 Using business payment method: ${businessPaymentMethod.name} (****${businessPaymentMethod.last_four})`);
      } else {
        console.warn('⚠️ No default business payment method found');
      }
    } catch (pmFetchError) {
      console.error('❌ Failed to fetch business payment method:', pmFetchError);
    }

    // Prepare Zinc order data
    const shippingAddress = order.shipping_info;
    const billingInfo = order.billing_info;
    
    // Parse shipping name into first and last name
    const shippingNameParts = (shippingAddress.name || "").split(" ");
    const shippingFirstName = shippingNameParts[0] || "Customer";
    const shippingLastName = shippingNameParts.slice(1).join(" ") || "Name";
    
    // Use billing info if available, otherwise fall back to shipping
    const cardholderName = billingInfo?.cardholderName || shippingAddress.name || "Customer Name";
    const billingNameParts = cardholderName.split(" ");
    const billingFirstName = billingNameParts[0] || "Customer";
    const billingLastName = billingNameParts.slice(1).join(" ") || "Name";
    
    // Use billing address if provided, otherwise fall back to shipping address
    const billingAddressData = billingInfo?.billingAddress || {
      name: cardholderName,
      address: shippingAddress.address || shippingAddress.address_line1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode || shippingAddress.zip_code,
      country: "US"
    };
    
    const orderData = {
      retailer: "amazon",
      products: order.order_items.map((item: any) => ({
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
        address_line1: billingAddressData.address,
        address_line2: "",
        zip_code: billingAddressData.zipCode,
        city: billingAddressData.city,
        state: billingAddressData.state,
        country: billingAddressData.country
      },
      payment_method: businessPaymentMethod ? {
        name_on_card: businessPaymentMethod.name_on_card,
        number: businessPaymentMethod.decrypted_number,
        expiration_month: businessPaymentMethod.exp_month,
        expiration_year: businessPaymentMethod.exp_year,
        security_code: businessPaymentMethod.decrypted_cvv,
        type: "card",
        use_gift: false
      } : {
        name_on_card: cardholderName,
        type: "card",
        use_gift: false
      },
      is_gift: order.is_gift || false,
      gift_message: order.gift_message || "",
      is_test: isTestMode,
      retailer_credentials: {
        email: credentials.email,
        password: credentials.encrypted_password,
        verification_code: credentials.verification_code || "639146",
        totp_2fa_key: credentials.totp_2fa_key || undefined
      }
    };

    if (debugMode) {
      console.log("🐛 Complete order data being sent to Zinc:", JSON.stringify(orderData, null, 2));
    } else {
      console.log("📦 Order data prepared:", {
        retailer: orderData.retailer,
        productCount: orderData.products.length,
        isGift: orderData.is_gift,
        isTest: orderData.is_test,
        hasVerificationCode: !!orderData.retailer_credentials.verification_code,
        has2FA: !!orderData.retailer_credentials.totp_2fa_key
      });
    }

    console.log("📡 Sending request to Zinc API...");

    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    const requestStartTime = Date.now();
    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${zincApiKey}:`)}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Elyphant-OrderProcessor/1.0'
      },
      body: JSON.stringify(orderData)
    });

    const requestDuration = Date.now() - requestStartTime;
    console.log(`⏱️ Zinc API response received in ${requestDuration}ms - Status: ${zincResponse.status} ${zincResponse.statusText}`);

    if (debugMode) {
      console.log(`🐛 Response Headers:`, Object.fromEntries(zincResponse.headers.entries()));
    }

    if (zincResponse.ok) {
      const zincOrder = await zincResponse.json();
      console.log("✅ Zinc order processed successfully:", zincOrder.request_id);
      
      if (debugMode) {
        console.log("🐛 Full Zinc response:", JSON.stringify(zincOrder, null, 2));
      }

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
        console.error('❌ Error updating order with Zinc ID:', updateError);
      }

      // Log successful order processing
      await supabaseClient
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `Zinc order successfully submitted. Zinc Order ID: ${zincOrder.request_id}. Test mode: ${isTestMode}. Response time: ${requestDuration}ms.`,
          note_type: 'system',
          is_internal: true
        });

      return new Response(JSON.stringify({
        success: true,
        zincOrderId: zincOrder.request_id,
        orderId: orderId,
        testMode: isTestMode,
        processingTime: requestDuration,
        nextSteps: 'Order submitted to Zinc. Status will be updated automatically via background checks.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      const errorResponse = await zincResponse.text();
      console.error(`❌ Zinc API error (${zincResponse.status}):`, errorResponse);
      
      if (debugMode) {
        console.log(`🐛 Full error response body:`, errorResponse);
      }
      
      // Log the error details
      await supabaseClient
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `Zinc order submission failed. Status: ${zincResponse.status}. Error: ${errorResponse}. Test mode: ${isTestMode}.`,
          note_type: 'error',
          is_internal: true
        });
      
      // Update order status to failed
      await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
          zinc_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      throw new Error(`Zinc API error (${zincResponse.status}): ${errorResponse}`);
    }

  } catch (error) {
    console.error('🚨 Error processing Zinc order:', error);
    
    // Try to log the error to the database if we have an orderId
    const { orderId } = await req.json().catch(() => ({}));
    if (orderId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `Critical error during Zinc order processing: ${error.message}`,
          note_type: 'error',
          is_internal: true
        }).catch(console.error);
    }
    
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
