import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      cartItems,
      deliveryGroups,
      scheduledDeliveryDate,
      giftOptions,
      isAutoGift,
      autoGiftRuleId,
      paymentMethod,
      pricingBreakdown,
      shippingInfo
    } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    if (!pricingBreakdown) {
      throw new Error("Pricing breakdown is required");
    }

    logStep("Request data received", { 
      itemCount: cartItems.length, 
      totalAmount: pricingBreakdown.subtotal + pricingBreakdown.shippingCost + pricingBreakdown.giftingFee + pricingBreakdown.taxAmount,
      isAutoGift,
      scheduledDeliveryDate 
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({ 
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Calculate total amount
    const totalAmount = pricingBreakdown.subtotal + pricingBreakdown.shippingCost + pricingBreakdown.giftingFee + pricingBreakdown.taxAmount;
    const amountInCents = Math.round(totalAmount * 100);

    // Build line items for Stripe (no metadata limits here!)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || item.product?.name,
          images: item.image_url ? [item.image_url] : (item.product?.image ? [item.product.image] : []),
          metadata: {
            product_id: item.product_id || item.product?.product_id,
            recipient_id: item.recipientAssignment?.connectionId || '',
            recipient_name: item.recipientAssignment?.connectionName || ''
          }
        },
        unit_amount: Math.round((item.price || item.product?.price || 0) * 100)
      },
      quantity: item.quantity
    }));

    // Add shipping fee as line item if applicable
    if (pricingBreakdown.shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping'
          },
          unit_amount: Math.round(pricingBreakdown.shippingCost * 100)
        },
        quantity: 1
      });
    }

    // Add gifting fee as line item if applicable
    if (pricingBreakdown.giftingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: pricingBreakdown.giftingFeeName || 'Gifting Fee',
            description: pricingBreakdown.giftingFeeDescription || 'Gift wrapping and handling'
          },
          unit_amount: Math.round(pricingBreakdown.giftingFee * 100)
        },
        quantity: 1
      });
    }

    // Add tax as line item if applicable
    if (pricingBreakdown.taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: 'Sales tax'
          },
          unit_amount: Math.round(pricingBreakdown.taxAmount * 100)
        },
        quantity: 1
      });
    }

    logStep("Line items prepared", { lineItemCount: lineItems.length });

    // Determine if payment should be held (for scheduled deliveries)
    const isScheduled = scheduledDeliveryDate && new Date(scheduledDeliveryDate) > new Date();
    
    // Build metadata (500 char limit per field, but we have plenty of fields)
    const metadata: Record<string, string> = {
      user_id: user.id,
      user_email: user.email,
      item_count: String(cartItems.length),
      scheduled_delivery_date: scheduledDeliveryDate || '',
      is_auto_gift: String(!!isAutoGift),
      auto_gift_rule_id: autoGiftRuleId || '',
      created_at: new Date().toISOString(),
      // Store pricing breakdown for order creation
      subtotal: String(pricingBreakdown.subtotal),
      shipping_cost: String(pricingBreakdown.shippingCost),
      gifting_fee: String(pricingBreakdown.giftingFee),
      tax_amount: String(pricingBreakdown.taxAmount),
    };

    // Store delivery groups and gift options as JSON (truncate if needed)
    if (deliveryGroups) {
      const deliveryGroupsStr = JSON.stringify(deliveryGroups);
      metadata.delivery_groups = deliveryGroupsStr.substring(0, 500);
    }

    if (giftOptions) {
      const giftOptionsStr = JSON.stringify(giftOptions);
      metadata.gift_options = giftOptionsStr.substring(0, 500);
    }

    if (shippingInfo) {
      const shippingInfoStr = JSON.stringify(shippingInfo);
      metadata.shipping_info = shippingInfoStr.substring(0, 500);
    }

    logStep("Metadata prepared", { metadataKeys: Object.keys(metadata).length });

    // Get domain for redirect URLs
    const origin = req.headers.get('origin') || 'http://localhost:8080';
    const successUrl = `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout`;

    // Create Checkout Session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      customer_email: user.email,
      billing_address_collection: 'required',
    };

    // For scheduled deliveries, hold the payment
    if (isScheduled) {
      sessionParams.payment_intent_data = {
        capture_method: 'manual', // Hold funds until scheduled date
        metadata: {
          ...metadata,
          payment_type: 'scheduled'
        }
      };
      logStep("Configured for scheduled delivery (manual capture)");
    }

    // For auto-gifts with saved payment method
    if (isAutoGift && paymentMethod) {
      sessionParams.payment_method_types = ['card'];
      sessionParams.payment_intent_data = {
        ...(sessionParams.payment_intent_data || {}),
        payment_method: paymentMethod,
        setup_future_usage: 'off_session',
      };
      logStep("Configured for auto-gift with saved payment method");
    }

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url 
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        session_id: session.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
