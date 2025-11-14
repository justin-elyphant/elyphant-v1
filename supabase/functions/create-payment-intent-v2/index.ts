import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      amount, 
      currency = 'usd', 
      cartItems, 
      shippingAddress,
      shippingInfo, // accept legacy/frontend alias
      deliveryGroups,
      scheduledDeliveryDate,
      isAutoGift = false,
      autoGiftRuleId,
      giftOptions,
      paymentMethodId // For auto-gifting with saved cards
    } = await req.json();

    console.log('🔵 Creating payment intent v2:', {
      amount,
      itemCount: cartItems?.length,
      scheduledDate: scheduledDeliveryDate,
      isAutoGift,
      timestamp: new Date().toISOString()
    });

    // Normalize inputs
    const normalizedShippingAddress = shippingAddress || shippingInfo;
    const incomingAmount = Number(amount);
    const amountInCents = incomingAmount > 999 
      ? Math.round(incomingAmount) // already in cents
      : Math.round(incomingAmount * 100); // convert dollars to cents
    console.log('💵 Normalized amount (cents):', amountInCents);

    // Initialize Supabase
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get user
    let user = null;
    let customer_id = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    // Initialize Stripe
    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Get or create Stripe customer
    if (user?.email) {
      const customers = await stripe.customers.list({ 
        email: user.email,
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customer_id = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id }
        });
        customer_id = customer.id;
      }
    }

    // Build metadata - Stripe has 500 char limit per field
    // Store minimal cart data here, full details in description or separate storage
    const minimalCartItems = (cartItems || []).map(item => ({
      id: item.product_id,
      qty: item.quantity,
      price: item.price
    }));
    
    const metadata: Record<string, string> = {
      user_id: user?.id || 'guest',
      user_email: user?.email || 'guest',
      cart_items_count: String((cartItems || []).length),
      cart_items_minimal: JSON.stringify(minimalCartItems).substring(0, 500),
      scheduled_delivery_date: scheduledDeliveryDate || '',
      is_auto_gift: isAutoGift.toString(),
      auto_gift_rule_id: autoGiftRuleId || '',
      created_at: new Date().toISOString(),
    };
    
    // Add shipping info if present (truncate if needed)
    if (normalizedShippingAddress) {
      const shippingStr = JSON.stringify(normalizedShippingAddress);
      metadata.shipping_address = shippingStr.substring(0, 500);
    }
    
    // Add gift options if present (truncate if needed)
    if (giftOptions) {
      const giftStr = JSON.stringify(giftOptions);
      metadata.gift_options = giftStr.substring(0, 500);
    }

    console.log('📦 Metadata size check:', {
      cart_items_minimal: metadata.cart_items_minimal?.length,
      shipping_address: metadata.shipping_address?.length,
      gift_options: metadata.gift_options?.length
    });

    // Create payment intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency,
      metadata,
      customer: customer_id || undefined,
      // Store full cart details in description (up to 1000 chars)
      description: `Order for ${user?.email || 'guest'} - ${(cartItems || []).length} items`,
    };

    // For scheduled delivery, use manual capture to hold funds
    if (scheduledDeliveryDate && new Date(scheduledDeliveryDate) > new Date()) {
      paymentIntentParams.capture_method = 'manual';
      console.log('📅 Using manual capture for scheduled delivery');
    }

    // For auto-gifting with saved payment method
    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirm = true;
      paymentIntentParams.off_session = true;
      console.log('🎁 Using saved payment method for auto-gift');
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    console.log('✅ Payment intent created:', paymentIntent.id);
    
    // Store full cart details in database for webhook retrieval
    // This avoids Stripe metadata limits
    try {
      const { error: dbError } = await supabase
        .from('payment_intent_data')
        .insert({
          payment_intent_id: paymentIntent.id,
          user_id: user?.id || null,
          cart_items: cartItems || [],
          shipping_address: normalizedShippingAddress || null,
          delivery_groups: deliveryGroups || null,
          gift_options: giftOptions || null,
          created_at: new Date().toISOString(),
        });
      
      if (dbError) {
        console.error('⚠️ Failed to store payment intent data:', dbError);
        // Non-critical - webhook can still work with metadata
      } else {
        console.log('💾 Stored full cart data in database for webhook retrieval');
      }
    } catch (dbError) {
      console.error('⚠️ Database storage error:', dbError);
      // Continue anyway - not critical for payment flow
    }

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
