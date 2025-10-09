import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { orderId, paymentIntentId, action } = await req.json();

    console.log('🔧 Admin reconcile request:', { orderId, paymentIntentId, action });

    if (action === 'reconcile') {
      // Update order with correct payment intent and mark as succeeded
      const { data: order, error: updateError } = await supabaseClient
        .from('orders')
        .update({
          stripe_payment_intent_id: paymentIntentId,
          payment_status: 'succeeded',
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to reconcile payment:', updateError);
        throw updateError;
      }

      console.log('✅ Payment reconciled:', order);

      // Trigger order processing
      const { data: processData, error: processError } = await supabaseClient.functions.invoke('process-zma-order', {
        body: { orderId }
      });

      if (processError) {
        console.warn('⚠️ Order updated but processing failed:', processError);
      } else {
        console.log('✅ Order processing triggered');
      }

      return new Response(
        JSON.stringify({ success: true, order, processing: processData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cleanup') {
      // Delete duplicate orders
      const { orderIds } = await req.json();
      const { error: deleteError } = await supabaseClient
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (deleteError) {
        console.error('❌ Failed to delete orders:', deleteError);
        throw deleteError;
      }

      console.log('✅ Duplicate orders deleted:', orderIds);

      return new Response(
        JSON.stringify({ success: true, deleted: orderIds }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('💥 Admin reconcile error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
