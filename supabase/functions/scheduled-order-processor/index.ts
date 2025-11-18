import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
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
    console.log('📅 Processing scheduled orders...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Find orders scheduled for today or earlier
    const today = new Date().toISOString().split('T')[0];
    
    const { data: scheduledOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_delivery_date', today)
      .order('scheduled_delivery_date', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📦 Found ${scheduledOrders?.length || 0} orders to process`);

    const results = {
      processed: [] as string[],
      failed: [] as { orderId: string; error: string }[],
    };

    for (const order of scheduledOrders || []) {
      try {
        console.log(`⏰ Processing scheduled order: ${order.id}`);

        // If payment was held (manual capture), capture it now
        if (order.payment_status === 'authorized') {
          console.log('💳 Capturing held payment...');
          
          const paymentIntent = await stripe.paymentIntents.capture(
            order.payment_intent_id
          );

          if (paymentIntent.status !== 'succeeded') {
            throw new Error(`Payment capture failed: ${paymentIntent.status}`);
          }

          // Update payment status
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', order.id);

          console.log('✅ Payment captured successfully');
        }

        // Invoke process-order-v2
        const { data, error: processError } = await supabase.functions.invoke('process-order-v2', {
          body: { orderId: order.id }
        });

        if (processError) {
          throw processError;
        }

        results.processed.push(order.id);
        console.log(`✅ Order ${order.id} processed successfully`);

      } catch (error: any) {
        console.error(`❌ Failed to process order ${order.id}:`, error);
        results.failed.push({
          orderId: order.id,
          error: error.message,
        });

        // Update order status to failed
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            notes: `Scheduled processing failed: ${error.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }
    }

    console.log('📊 Scheduled order processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.processed.length,
        failed: results.failed.length,
        details: results,
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
