import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { 
  PAYMENT_LEAD_TIME_CONFIG, 
  isReadyForCapture, 
  isReadyForSubmission 
} from '../shared/paymentLeadTime.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse optional simulatedDate from request body
    let simulatedDate: string | null = null;
    try {
      const body = await req.json();
      simulatedDate = body?.simulatedDate || null;
    } catch {
      // No body or invalid JSON - use real date
    }

    console.log('📅 Running scheduled order processor (two-stage)...');
    console.log(`⚙️ Config: Capture ${PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS} days before Zinc, Ship ${PAYMENT_LEAD_TIME_CONFIG.SHIPPING_BUFFER_DAYS} days before arrival`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Use simulated date if provided, otherwise use real date
    const today = simulatedDate ? new Date(simulatedDate) : new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`📅 Using date: ${todayStr}${simulatedDate ? ' (SIMULATED)' : ''}`);
    
    // Calculate total lead time: CAPTURE_LEAD_DAYS + SHIPPING_BUFFER_DAYS before arrival
    const totalLeadDays = PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS + 
                          PAYMENT_LEAD_TIME_CONFIG.SHIPPING_BUFFER_DAYS;
    
    // Stage 1 threshold: orders with arrival date within totalLeadDays need payment captured
    const captureThresholdDate = new Date(today);
    captureThresholdDate.setDate(captureThresholdDate.getDate() + totalLeadDays);
    const captureThresholdStr = captureThresholdDate.toISOString().split('T')[0];
    
    // Stage 2 threshold: orders with arrival date within SHIPPING_BUFFER_DAYS need Zinc submission
    const submitThresholdDate = new Date(today);
    submitThresholdDate.setDate(submitThresholdDate.getDate() + PAYMENT_LEAD_TIME_CONFIG.SHIPPING_BUFFER_DAYS);
    const submitThresholdStr = submitThresholdDate.toISOString().split('T')[0];

    const results = {
      authorized: [] as string[], // Stage 0: pending_payment → scheduled
      captured: [] as string[],   // Stage 1: scheduled → payment_confirmed
      submitted: [] as string[],  // Stage 2: payment_confirmed → processing
      failed: [] as { orderId: string; error: string; stage: string }[],
    };

    // ============================================
    // STAGE 0: Authorize pending_payment orders (deferred payment - 8+ days at checkout)
    // These orders had setup mode checkout, now entering the 7-day authorization window
    // ============================================
    console.log(`🔮 Stage 0: Authorizing pending_payment orders entering T-7 window (delivery <= ${captureThresholdStr})`);

    const { data: ordersToAuthorize, error: authQueryError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending_payment')
      .lte('scheduled_delivery_date', captureThresholdStr)
      .order('scheduled_delivery_date', { ascending: true });

    if (authQueryError) {
      console.error('❌ Error querying orders to authorize:', authQueryError);
    } else {
      console.log(`📦 Found ${ordersToAuthorize?.length || 0} pending_payment orders to authorize`);

      for (const order of ordersToAuthorize || []) {
        try {
          console.log(`🔮 Authorizing deferred payment for order: ${order.id} (delivery: ${order.scheduled_delivery_date})`);

          // Get the SetupIntent to retrieve the payment method
          if (!order.setup_intent_id) {
            throw new Error('No setup_intent_id found for pending_payment order');
          }

          const setupIntent = await stripe.setupIntents.retrieve(order.setup_intent_id);
          
          if (!setupIntent.payment_method) {
            throw new Error('No payment_method attached to SetupIntent');
          }

          const paymentMethodId = typeof setupIntent.payment_method === 'string' 
            ? setupIntent.payment_method 
            : setupIntent.payment_method.id;

          const customerId = order.stripe_customer_id || 
            (typeof setupIntent.customer === 'string' ? setupIntent.customer : setupIntent.customer?.id);

          if (!customerId) {
            throw new Error('No customer ID found for order');
          }

          // Create a new PaymentIntent with manual capture (authorize only)
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.total_amount * 100),
            currency: order.currency || 'usd',
            customer: customerId,
            payment_method: paymentMethodId,
            capture_method: 'manual', // Authorize only - will capture at T-7
            confirm: true,
            off_session: true,
            metadata: {
              order_id: order.id,
              deferred_authorization: 'true',
              original_setup_intent: order.setup_intent_id,
            },
          });

          if (paymentIntent.status !== 'requires_capture') {
            throw new Error(`Unexpected PaymentIntent status: ${paymentIntent.status}`);
          }

          // Update order: pending_payment → scheduled (now has valid authorization)
          await supabase
            .from('orders')
            .update({
              payment_intent_id: paymentIntent.id,
              payment_method_id: paymentMethodId,
              status: 'scheduled', // Now has fresh authorization
              payment_status: 'authorized',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          results.authorized.push(order.id);
          console.log(`✅ Deferred order ${order.id} authorized: ${paymentIntent.id}`);

        } catch (error: any) {
          console.error(`❌ Failed to authorize order ${order.id}:`, error);
          results.failed.push({
            orderId: order.id,
            error: error.message,
            stage: 'authorize',
          });

          // Mark order as needing attention (payment method may have failed)
          await supabase
            .from('orders')
            .update({
              status: 'requires_attention',
              notes: `Deferred authorization failed: ${error.message}. Customer may need to update payment method.`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
        }
      }
    }

    // ============================================
    // STAGE 1: Capture payments for orders within lead time
    // ============================================
    console.log(`💳 Stage 1: Capturing payments for orders with delivery <= ${captureThresholdStr}`);

    const { data: ordersToCapture, error: captureQueryError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'scheduled')
      .eq('payment_status', 'authorized')
      .lte('scheduled_delivery_date', captureThresholdStr)
      .order('scheduled_delivery_date', { ascending: true });

    if (captureQueryError) {
      console.error('❌ Error querying orders to capture:', captureQueryError);
      throw captureQueryError;
    }

    console.log(`📦 Found ${ordersToCapture?.length || 0} orders to capture payment`);

    for (const order of ordersToCapture || []) {
      try {
        const deliveryDate = new Date(order.scheduled_delivery_date);
        
        if (!isReadyForCapture(deliveryDate, today)) {
          console.log(`⏳ Order ${order.id} not ready for capture yet`);
          continue;
        }

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
            status: PAYMENT_LEAD_TIME_CONFIG.CAPTURED_STATUS,
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
    // STAGE 2: Submit to Zinc for orders arriving within SHIPPING_BUFFER_DAYS
    // ============================================
    console.log(`🚀 Stage 2: Submitting orders with arrival <= ${submitThresholdStr} to Zinc`);

    const { data: ordersToSubmit, error: submitQueryError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', PAYMENT_LEAD_TIME_CONFIG.CAPTURED_STATUS)
      .lte('scheduled_delivery_date', submitThresholdStr)
      .order('scheduled_delivery_date', { ascending: true });

    if (submitQueryError) {
      console.error('❌ Error querying orders to submit:', submitQueryError);
      throw submitQueryError;
    }

    console.log(`📦 Found ${ordersToSubmit?.length || 0} orders to submit to Zinc`);

    for (const order of ordersToSubmit || []) {
      try {
        const deliveryDate = new Date(order.scheduled_delivery_date);
        
        if (!isReadyForSubmission(deliveryDate, today)) {
          console.log(`⏳ Order ${order.id} not ready for Zinc submission yet`);
          continue;
        }

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
        authorized: results.authorized.length, // Stage 0: deferred → scheduled
        captured: results.captured.length,     // Stage 1: scheduled → payment_confirmed
        submitted: results.submitted.length,   // Stage 2: payment_confirmed → processing
        failed: results.failed.length,
        details: results,
        config: {
          paymentCaptureLeadDays: PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS,
          shippingBufferDays: PAYMENT_LEAD_TIME_CONFIG.SHIPPING_BUFFER_DAYS,
          capturedStatus: PAYMENT_LEAD_TIME_CONFIG.CAPTURED_STATUS,
          todayDate: todayStr,
          captureThresholdDate: captureThresholdStr,
          submitThresholdDate: submitThresholdStr,
          simulatedDate: simulatedDate || null,
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
