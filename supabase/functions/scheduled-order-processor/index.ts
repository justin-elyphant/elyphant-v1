import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Payment capture lead time in days - captures payment this many days before delivery
const PAYMENT_CAPTURE_LEAD_DAYS = 4;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📅 Running scheduled order processor (two-stage)...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate the capture date (4 days from now)
    const captureDate = new Date(today);
    captureDate.setDate(captureDate.getDate() + PAYMENT_CAPTURE_LEAD_DAYS);
    const captureDateStr = captureDate.toISOString().split('T')[0];

    const results = {
      captured: [] as string[],
      submitted: [] as string[],
      failed: [] as { orderId: string; error: string; stage: string }[],
    };

    // ============================================
    // STAGE 1: Capture payments for orders due in 4 days
    // ============================================
    console.log(`💳 Stage 1: Capturing payments for orders with delivery <= ${captureDateStr}`);

    const { data: ordersToCapture, error: captureQueryError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'scheduled')
      .eq('payment_status', 'authorized')
      .lte('scheduled_delivery_date', captureDateStr)
      .order('scheduled_delivery_date', { ascending: true });

    if (captureQueryError) {
      console.error('❌ Error querying orders to capture:', captureQueryError);
      throw captureQueryError;
    }

    console.log(`📦 Found ${ordersToCapture?.length || 0} orders to capture payment`);

    for (const order of ordersToCapture || []) {
      try {
        console.log(`💳 Capturing payment for order: ${order.id} (delivery: ${order.scheduled_delivery_date})`);

        if (!order.payment_intent_id) {
          throw new Error('No payment_intent_id found for order');
        }

        // Capture the held payment
        const paymentIntent = await stripe.paymentIntents.capture(order.payment_intent_id);

        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Payment capture failed: ${paymentIntent.status}`);
        }

        // Update order to payment_confirmed status
        await supabase
          .from('orders')
          .update({
            status: 'payment_confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        results.captured.push(order.id);
        console.log(`✅ Payment captured for order ${order.id}`);

      } catch (error: any) {
        console.error(`❌ Failed to capture payment for order ${order.id}:`, error);
        results.failed.push({
          orderId: order.id,
          error: error.message,
          stage: 'capture',
        });

        // Mark order as failed
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            notes: `Payment capture failed: ${error.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }
    }

    // ============================================
    // STAGE 2: Submit to Zinc for orders due today
    // ============================================
    console.log(`🚀 Stage 2: Submitting orders with delivery <= ${todayStr} to Zinc`);

    const { data: ordersToSubmit, error: submitQueryError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'payment_confirmed')
      .lte('scheduled_delivery_date', todayStr)
      .order('scheduled_delivery_date', { ascending: true });

    if (submitQueryError) {
      console.error('❌ Error querying orders to submit:', submitQueryError);
      throw submitQueryError;
    }

    console.log(`📦 Found ${ordersToSubmit?.length || 0} orders to submit to Zinc`);

    for (const order of ordersToSubmit || []) {
      try {
        console.log(`🚀 Submitting order ${order.id} to Zinc`);

        // Invoke process-order-v2
        const { data, error: processError } = await supabase.functions.invoke('process-order-v2', {
          body: { orderId: order.id }
        });

        if (processError) {
          throw processError;
        }

        results.submitted.push(order.id);
        console.log(`✅ Order ${order.id} submitted to Zinc successfully`);

      } catch (error: any) {
        console.error(`❌ Failed to submit order ${order.id}:`, error);
        results.failed.push({
          orderId: order.id,
          error: error.message,
          stage: 'submit',
        });

        // Update order status to failed
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            notes: `Zinc submission failed: ${error.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }
    }

    console.log('📊 Scheduled order processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        captured: results.captured.length,
        submitted: results.submitted.length,
        failed: results.failed.length,
        details: results,
        config: {
          paymentCaptureLeadDays: PAYMENT_CAPTURE_LEAD_DAYS,
          todayDate: todayStr,
          captureThresholdDate: captureDateStr,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Scheduled order processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
