// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zincApiKey = Deno.env.get('ZINC_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting return detection polling...');

    // Get all orders with Zinc order IDs that haven't been checked recently
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, zinc_order_id, status, total_amount, created_at')
      .not('zinc_order_id', 'is', null)
      .in('status', ['completed', 'processing'])
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    let returnEventsDetected = 0;
    let ordersChecked = 0;

    for (const order of orders || []) {
      try {
        ordersChecked++;
        
        // Check if we already have a return event for this order
        const { data: existingReturn } = await supabase
          .from('return_events')
          .select('id')
          .eq('order_id', order.id)
          .single();

        if (existingReturn) {
          continue; // Skip if already processed
        }

        // Call Zinc API to check order status
        const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${order.zinc_order_id}`, {
          headers: {
            'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!zincResponse.ok) {
          console.log(`Zinc API error for order ${order.zinc_order_id}: ${zincResponse.status}`);
          continue;
        }

        const zincOrder = await zincResponse.json();
        
        // Check for return indicators in Zinc response
        const hasReturnIndicators = 
          zincOrder.status === 'returned' ||
          zincOrder.status === 'refunded' ||
          (zincOrder.tracking && zincOrder.tracking.status === 'returned') ||
          (zincOrder.merchant_order_id && zincOrder.merchant_order_id.includes('return'));

        if (hasReturnIndicators) {
          console.log(`Return detected for order ${order.id} (Zinc: ${order.zinc_order_id})`);
          
          // Create return event record
          const { error: insertError } = await supabase
            .from('return_events')
            .insert({
              order_id: order.id,
              zinc_order_id: order.zinc_order_id,
              return_status: 'detected',
              return_reason: zincOrder.return_reason || 'Automatic detection via Zinc API',
              return_items: zincOrder.return_items || null,
              refund_amount: zincOrder.refund_amount || order.total_amount,
              detected_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error inserting return event:', insertError);
          } else {
            returnEventsDetected++;
            
            // Update order status if needed
            if (order.status !== 'returned') {
              await supabase
                .from('orders')
                .update({ 
                  status: 'returned',
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }

    const result = {
      success: true,
      ordersChecked,
      returnEventsDetected,
      timestamp: new Date().toISOString(),
    };

    console.log('Return detection completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Return detection error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});