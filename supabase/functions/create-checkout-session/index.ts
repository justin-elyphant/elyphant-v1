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
    
    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if this is a service-role call (from auto-gift-orchestrator)
    const isServiceRole = authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '');
    
    // Parse body early to check for auto-gift orchestrator calls
    const requestBody = await req.json();
    const { 
      cartItems,
      deliveryGroups,
      scheduledDeliveryDate,
      giftOptions,
      isAutoGift,
      autoGiftRuleId,
      paymentMethod,
      pricingBreakdown,
      shippingInfo,
      metadata: clientMetadata,
      isGroupGift = false,
      groupGiftProjectId,
      contributionAmount
    } = requestBody;

    // Handle authentication - allow service role for auto-gift orchestrator
    let user: { id: string; email: string };
    if (isServiceRole && isAutoGift) {
      // Auto-gift orchestrator passes user_id in metadata
      const userId = clientMetadata?.user_id;
      const userEmail = clientMetadata?.user_email || 'auto-gift@system';
      if (!userId) throw new Error("user_id required in metadata for auto-gift orchestrator");
      user = { id: userId, email: userEmail };
      logStep("Auto-gift orchestrator authenticated", { userId: user.id });
    } else {
      if (!authHeader) throw new Error("No authorization header provided");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (!userData.user?.email) throw new Error("User not authenticated");
      user = { id: userData.user.id, email: userData.user.email };
      logStep("User authenticated", { userId: user.id, email: user.email });
    }

    // Check if this is a payment intent only request (for Apple Pay)
    const isPaymentIntentOnly = clientMetadata?.payment_intent_only === true;

    // Group gift validation
    if (isGroupGift) {
      if (!groupGiftProjectId) {
        throw new Error("Group gift project ID is required");
      }
      if (!contributionAmount || contributionAmount < 5) {
        throw new Error("Minimum contribution is $5");
      }
      
      logStep("Group gift contribution request", { 
        projectId: groupGiftProjectId, 
        amount: contributionAmount 
      });
    }

    if (!isGroupGift && (!cartItems || cartItems.length === 0)) {
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
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isGroupGift ? [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Group Gift Contribution',
          description: `Contribution to group gift project`,
        },
        unit_amount: Math.round(contributionAmount * 100),
      },
      quantity: 1,
    }] : cartItems.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || item.product?.name,
          images: item.image_url ? [item.image_url] : (item.product?.image ? [item.product.image] : []),
          metadata: {
            product_id: item.product_id || item.product?.product_id,
            recipient_id: item.recipientAssignment?.connectionId || '',
            recipient_name: item.recipientAssignment?.connectionName || '',
            gift_message: item.recipientAssignment?.giftMessage || ''
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
      item_count: String(isGroupGift ? 1 : cartItems.length),
      scheduled_delivery_date: scheduledDeliveryDate || '',
      is_auto_gift: String(!!isAutoGift),
      auto_gift_rule_id: autoGiftRuleId || '',
      is_group_gift: String(!!isGroupGift),
      group_gift_project_id: groupGiftProjectId || '',
      contribution_amount: String(contributionAmount || 0),
      created_at: new Date().toISOString(),
      // Store pricing breakdown for order creation
      subtotal: String(pricingBreakdown.subtotal),
      shipping_cost: String(pricingBreakdown.shippingCost),
      gifting_fee: String(pricingBreakdown.giftingFee),
      tax_amount: String(pricingBreakdown.taxAmount),
    };

    // Merge in any client-provided metadata (without overwriting core fields)
    if (clientMetadata) {
      Object.keys(clientMetadata).forEach(key => {
        // Only add if not already defined (preserve our core metadata)
        if (metadata[key] === undefined) {
          metadata[key] = String(clientMetadata[key]);
        }
      });
    }

    // Store delivery groups as JSON (only if needed for complex routing)
    if (deliveryGroups && deliveryGroups.length > 0) {
      const deliveryGroupsStr = JSON.stringify(deliveryGroups);
      metadata.delivery_groups = deliveryGroupsStr.substring(0, 500);
      metadata.recipient_count = String(deliveryGroups.length);
    }

    // Store gift options as individual fields (no JSON truncation)
    if (giftOptions) {
      metadata.gift_message = String(giftOptions.message || '').substring(0, 500);
      metadata.gift_is_anonymous = String(!!giftOptions.isAnonymous);
    }

    // Store shipping address as individual metadata fields (no JSON)
    if (shippingInfo) {
      metadata.ship_name = String(shippingInfo.name || '').substring(0, 500);
      metadata.ship_address_line1 = String(shippingInfo.address_line1 || shippingInfo.street || '').substring(0, 500);
      metadata.ship_address_line2 = String(shippingInfo.address_line2 || '').substring(0, 500);
      metadata.ship_city = String(shippingInfo.city || '').substring(0, 500);
      metadata.ship_state = String(shippingInfo.state || '').substring(0, 500);
      metadata.ship_postal_code = String(
        shippingInfo.postal_code || shippingInfo.zip_code || shippingInfo.zipCode || shippingInfo.postalCode || ''
      ).substring(0, 500);
      metadata.ship_country = String(shippingInfo.country || 'US').substring(0, 500);
      metadata.ship_phone = String(shippingInfo.phone || '').substring(0, 500);
    }

    logStep("Metadata prepared", { metadataKeys: Object.keys(metadata).length });

    // APPLE PAY MODE: Create Payment Intent directly (no redirect)
    if (isPaymentIntentOnly) {
      logStep("Creating Payment Intent for Apple Pay (no redirect)");
      
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: 'usd',
        customer: customerId,
        metadata: {
          ...metadata,
          cart_items: JSON.stringify(cartItems).substring(0, 500)
        },
        description: `Order for ${cartItems.length} item(s)`
      };

      if (isScheduled) {
        paymentIntentParams.capture_method = 'manual';
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      logStep("Payment Intent created for Apple Pay", { 
        paymentIntentId: paymentIntent.id,
        amount: amountInCents 
      });

      return new Response(
        JSON.stringify({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STANDARD MODE: Create Checkout Session (redirect to Stripe)
    // Get domain for redirect URLs
    const origin = req.headers.get('origin') || 'http://localhost:8080';
    const successUrl = `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?cancelled=true`;

    // Create Checkout Session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: user.id, // CRITICAL: Ensure user_id is always set
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      // Shipping already collected at /checkout, passed in metadata (lines 236-245)
      // Webhook reads from session.shipping_details populated by Stripe from metadata
    };

    // For group gifts, hold funds in escrow until project completes
    if (isGroupGift) {
      sessionParams.payment_intent_data = {
        capture_method: 'manual', // Escrow - capture when project funded
        metadata: {
          ...metadata,
          payment_type: 'group_gift_contribution'
        }
      };
      sessionParams.success_url = `${origin}/group-gift/${groupGiftProjectId}?contribution=success&session_id={CHECKOUT_SESSION_ID}`;
      sessionParams.cancel_url = `${origin}/group-gift/${groupGiftProjectId}?contribution=cancelled`;
      logStep("Configured for group gift contribution (escrow)");
    }

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
