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

    // Build comprehensive metadata - THIS IS THE SOURCE OF TRUTH
    const metadata = {
      user_id: user?.id || 'guest',
      user_email: user?.email || 'guest',
      cart_items: JSON.stringify(cartItems || []),
      shipping_address: normalizedShippingAddress ? JSON.stringify(normalizedShippingAddress) : '',
      delivery_groups: deliveryGroups ? JSON.stringify(deliveryGroups) : '',
      scheduled_delivery_date: scheduledDeliveryDate || '',
      is_auto_gift: isAutoGift.toString(),
      auto_gift_rule_id: autoGiftRuleId || '',
      gift_options: giftOptions ? JSON.stringify(giftOptions) : '',
      created_at: new Date().toISOString(),
    };

    // Create payment intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      customer: customer_id || undefined,
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
