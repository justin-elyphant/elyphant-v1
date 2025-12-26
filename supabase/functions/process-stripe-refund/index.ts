import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refund_request_id, action } = await req.json();

    if (!refund_request_id) {
      return new Response(
        JSON.stringify({ error: 'refund_request_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Fetch refund request with order details
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select(`
        *,
        orders:order_id (
          id,
          order_number,
          payment_intent_id,
          user_id,
          customer_email,
          shipping_address,
          total_amount
        )
      `)
      .eq('id', refund_request_id)
      .single();

    if (fetchError || !refundRequest) {
      console.error('❌ Refund request not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Refund request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (refundRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Refund already ${refundRequest.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const order = refundRequest.orders;

    // Handle rejection
    if (action === 'reject') {
      await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
        })
        .eq('id', refund_request_id);

      console.log(`❌ Refund rejected for order ${order.order_number}`);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Refund rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Process Stripe refund
    if (!order.payment_intent_id) {
      await supabase
        .from('refund_requests')
        .update({
          status: 'failed',
          error_message: 'No payment_intent_id on order',
          processed_at: new Date().toISOString(),
        })
        .eq('id', refund_request_id);

      return new Response(
        JSON.stringify({ error: 'Order has no payment_intent_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const refundAmountCents = Math.round(refundRequest.amount * 100);

    console.log(`💳 Processing Stripe refund: $${refundRequest.amount} (${refundAmountCents} cents) for PI: ${order.payment_intent_id}`);

    const stripeRefund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        refund_request_id: refund_request_id,
        refund_reason: refundRequest.reason,
      },
    });

    console.log(`✅ Stripe refund created: ${stripeRefund.id}`);

    // Update refund request with Stripe refund ID
    await supabase
      .from('refund_requests')
      .update({
        status: 'completed',
        stripe_refund_id: stripeRefund.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', refund_request_id);

    // Update order payment status
    await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // Get customer info for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', order.user_id)
      .single();

    const customerEmail = order.shipping_address?.email || order.customer_email || profile?.email;
    const customerName = order.shipping_address?.name || profile?.name || 'Customer';

    if (customerEmail) {
      // Queue customer refund email
      await supabase.from('email_queue').insert({
        recipient_email: customerEmail,
        recipient_name: customerName,
        event_type: 'refund_processed',
        template_variables: {
          customer_name: customerName,
          order_number: order.order_number,
          refund_amount: refundRequest.amount.toFixed(2),
          refund_reason: refundRequest.reason,
          repurchase_url: 'https://elyphant.com/marketplace',
        },
        priority: 'high',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
      });

      console.log(`📧 Customer refund email queued to ${customerEmail}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refund processed successfully',
        stripe_refund_id: stripeRefund.id,
        amount: refundRequest.amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ process-stripe-refund error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
