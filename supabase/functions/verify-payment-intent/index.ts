import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillingInfo {
  cardholderName: string;
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * Extracts billing information from Stripe PaymentIntent
 */
function extractBillingInfoFromPaymentIntent(paymentIntent: any): BillingInfo | null {
  try {
    // Get the payment method details
    const paymentMethod = paymentIntent.payment_method;
    if (!paymentMethod || !paymentMethod.billing_details) {
      console.log('No billing details found in payment method');
      return null;
    }

    const billing = paymentMethod.billing_details;
    
    // Get cardholder name from payment method
    const cardholderName = billing.name || 'Card Holder';
    
    // Extract billing address if available
    let billingAddress = undefined;
    if (billing.address) {
      billingAddress = {
        name: cardholderName,
        address: billing.address.line1 || '',
        city: billing.address.city || '',
        state: billing.address.state || '',
        zipCode: billing.address.postal_code || '',
        country: billing.address.country || 'US'
      };
    }
    
    console.log('Extracted billing info:', { cardholderName, hasBillingAddress: !!billingAddress });
    
    return {
      cardholderName,
      billingAddress
    };
  } catch (error) {
    console.error('Error extracting billing info from PaymentIntent:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_intent_id, order_id } = await req.json();

    if (!payment_intent_id || !order_id) {
      throw new Error('Missing payment_intent_id or order_id');
    }

    console.log(`🔍 Verifying payment intent ${payment_intent_id} for order ${order_id}`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve the payment intent with payment method details
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id, {
      expand: ['payment_method']
    });

    console.log(`💳 Payment intent status: ${paymentIntent.status}`);

    if (paymentIntent.status === 'succeeded') {
      // Extract billing information from the payment intent
      const billingInfo = extractBillingInfoFromPaymentIntent(paymentIntent);
      
      // Get the order to verify it exists
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (orderError || !order) {
        console.error('❌ Order not found:', orderError);
        throw new Error(`Order not found: ${orderError?.message}`);
      }

      console.log(`✅ Order found: ${order.order_number}`);

      // Update order status and billing info
      const updateData: any = {
        payment_status: 'succeeded',
        status: 'confirmed',
        stripe_payment_intent_id: payment_intent_id,
        updated_at: new Date().toISOString()
      };

      // Add billing info if we extracted it successfully
      if (billingInfo) {
        updateData.billing_info = billingInfo;
        console.log(`💾 Storing billing info for cardholder: ${billingInfo.cardholderName}`);
      } else {
        console.log('⚠️ No billing info extracted, order will use fallback logic');
      }

      const { error: updateError } = await supabaseClient
        .from('orders')
        .update(updateData)
        .eq('id', order_id);

      if (updateError) {
        console.error('❌ Error updating order:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      console.log('✅ Order updated successfully with payment confirmation and billing info');

      // Trigger Zinc order processing
      try {
        console.log('🚀 Triggering Zinc processing...');
        const { data: zincResponse, error: zincError } = await supabaseClient.functions.invoke('process-zma-order', {
          body: { 
            orderId: order_id,
            isTestMode: false
          }
        });

        if (zincError) {
          console.error('⚠️ Zinc processing error (non-fatal):', zincError);
          // Don't fail the whole verification if Zinc fails - log it but continue
        } else {
          console.log('✅ Zinc processing initiated:', zincResponse);
        }
      } catch (zincError) {
        console.error('⚠️ Error calling Zinc processing (non-fatal):', zincError);
        // Continue even if Zinc fails - the payment was successful
      }

      return new Response(JSON.stringify({ 
        success: true, 
        order_id: order_id,
        order_number: order.order_number,
        payment_status: 'succeeded',
        message: 'Payment verified and order processing initiated',
        billingInfoCaptured: !!billingInfo,
        cardholderName: billingInfo?.cardholderName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      console.log(`❌ Payment not successful. Status: ${paymentIntent.status}`);
      
      // Update order to reflect payment failure
      await supabaseClient
        .from('orders')
        .update({
          payment_status: paymentIntent.status,
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      return new Response(JSON.stringify({ 
        success: false, 
        message: `Payment not successful: ${paymentIntent.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('🚨 Error verifying payment intent:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});