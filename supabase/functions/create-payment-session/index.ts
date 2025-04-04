
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, eventId, productId, productName, productImage, paymentType } = await req.json();

    // Validate based on payment type
    if (paymentType === 'autogift' && (!amount || !eventId)) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields for auto-gift. Please provide amount and eventId."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    if (paymentType === 'direct-purchase' && (!amount || !productId || !productName)) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields for direct purchase. Please provide amount, productId, and productName."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    if (!paymentType) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: paymentType"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Initialize Stripe with the secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create line items based on payment type
    let lineItems = [];
    let metadata = {};
    
    if (paymentType === 'autogift') {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Auto-Gift Payment",
            description: `Payment for event ID: ${eventId}`,
          },
          unit_amount: amount * 100, // Convert dollars to cents
        },
        quantity: 1,
      });
      metadata = { eventId, paymentType };
    } else if (paymentType === 'direct-purchase') {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
            description: `Product ID: ${productId}`,
            images: productImage ? [productImage] : undefined,
          },
          unit_amount: amount * 100, // Convert dollars to cents
        },
        quantity: 1,
      });
      metadata = { productId, paymentType };
    }

    // Determine success and cancel URLs based on payment type
    let successUrl = `${req.headers.get("origin")}/settings?tab=payment&success=true`;
    let cancelUrl = `${req.headers.get("origin")}/settings?tab=payment&canceled=true`;
    
    if (paymentType === 'direct-purchase') {
      successUrl = `${req.headers.get("origin")}/purchase-success?product=${productId}`;
      cancelUrl = `${req.headers.get("origin")}/marketplace`;
    }

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error creating payment session:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
