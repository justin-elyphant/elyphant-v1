import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Zinc Order Cancellation Edge Function
 * 
 * Cancels orders via Zinc API for Elyphant.com admin use only.
 * 
 * Zinc Cancellation Policy:
 * - Pre-shipment cancellation only
 * - Supported on Amazon.com and Amazon.co.uk
 * - Can only cancel after order is successfully placed (not while processing)
 * - ~50% of cases enter "attempting_to_cancel" state (polls retailer, resolves to success/failure)
 * 
 * Webhooks:
 * - request_succeeded: Cancellation successful
 * - request_failed: Cancellation failed or still attempting
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('🚫 Cancelling order:', orderId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Fetch order details
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, zinc_request_id, zinc_order_id, status, notes, user_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('❌ Order not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (!order.zinc_request_id) {
      console.error('❌ Order has no zinc_request_id:', orderId);
      return new Response(
        JSON.stringify({ error: 'Order was not submitted to Zinc. Cannot cancel.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if already cancelled
    if (['cancelled', 'cancellation_pending'].includes(order.status)) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order is already cancelled or pending cancellation',
          status: order.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Make cancellation request to Zinc
    const ZINC_API_KEY = Deno.env.get('ZINC_API_KEY');
    if (!ZINC_API_KEY) {
      throw new Error('ZINC_API_KEY not configured');
    }

    const webhookBaseUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook`;
    
    console.log('📤 Sending cancellation request to Zinc for request_id:', order.zinc_request_id);

    const zincResponse = await fetch(
      `https://api.zinc.io/v1/orders/${order.zinc_request_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(ZINC_API_KEY + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhooks: {
            request_succeeded: webhookBaseUrl,
            request_failed: webhookBaseUrl,
          },
          client_notes: {
            order_id: order.id,
            order_number: order.order_number,
            user_id: order.user_id,
            cancellation_source: 'admin_trunkline',
          }
        })
      }
    );

    const zincData = await zincResponse.json();
    
    if (!zincResponse.ok) {
      console.error('❌ Zinc cancellation failed:', zincData);
      
      // Update order with failure
      const currentNotes = order.notes || {};
      await supabase
        .from('orders')
        .update({
          notes: {
            ...currentNotes,
            cancellation_attempted_at: new Date().toISOString(),
            cancellation_error: zincData.message || 'Unknown error',
            zinc_cancellation_response: zincData,
          }
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: zincData.message || 'Zinc cancellation request failed',
          details: zincData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('✅ Zinc cancellation request accepted:', zincData);

    // Update order status to cancellation_pending
    // Webhook will update to 'cancelled' when confirmed
    const currentNotes = order.notes || {};
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancellation_pending',
        notes: {
          ...currentNotes,
          cancellation_requested_at: new Date().toISOString(),
          zinc_cancellation_request_id: zincData.request_id,
          cancellation_source: 'admin_trunkline',
        }
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Failed to update order status:', updateError);
      throw updateError;
    }

    console.log('📝 Order updated to cancellation_pending');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cancellation request sent to Zinc. Order status updated to cancellation_pending.',
        zinc_request_id: zincData.request_id,
        note: 'About 50% of cancellations enter "attempting_to_cancel" state and may take time to resolve.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Cancel order error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
