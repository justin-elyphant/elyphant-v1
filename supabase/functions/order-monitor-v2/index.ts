import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('👁️ Running order monitor...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Find orders in processing status
    const { data: processingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'processing')
      .not('zinc_order_id', 'is', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📦 Monitoring ${processingOrders?.length || 0} orders`);

    const results = {
      updated: [] as string[],
      stuck: [] as string[],
      failed: [] as { orderId: string; error: string }[],
    };

    for (const order of processingOrders || []) {
      try {
        console.log(`🔍 Checking Zinc status for order: ${order.id}`);

        // Check Zinc API for order status
        const zincResponse = await fetch(
          `https://api.zinc.io/v1/orders/${order.zinc_order_id}`,
          {
            headers: {
              'Authorization': `Basic ${btoa(Deno.env.get('ZINC_API_KEY') + ':')}`,
            },
          }
        );

        if (!zincResponse.ok) {
          console.warn(`⚠️ Failed to fetch Zinc status for ${order.zinc_order_id}`);
          continue;
        }

        const zincData = await zincResponse.json();
        
        // Update order based on Zinc status
        const updates: any = {
          updated_at: new Date().toISOString(),
        };

        if (zincData.code === 'order_placed') {
          updates.status = 'shipped';
          updates.zinc_order_id = zincData.merchant_order_id;
          updates.tracking_number = zincData.tracking?.tracking_number;
          updates.estimated_delivery = zincData.tracking?.estimated_delivery;
          
          console.log(`✅ Order ${order.id} placed with merchant`);
          results.updated.push(order.id);
        } 
        else if (zincData.code === 'delivered') {
          updates.status = 'delivered';
          updates.fulfilled_at = new Date().toISOString();
          
          console.log(`📬 Order ${order.id} delivered`);
          results.updated.push(order.id);
        }
        else if (zincData.code === 'failed' || zincData.code === 'cancelled') {
          updates.status = 'failed';
          updates.notes = zincData.message || 'Order failed in Zinc';
          
          console.log(`❌ Order ${order.id} failed in Zinc`);
          results.updated.push(order.id);
        }

        // Check if order is stuck (>24 hours in processing)
        const orderAge = Date.now() - new Date(order.created_at).getTime();
        const hoursSinceCreated = orderAge / (1000 * 60 * 60);
        
        if (hoursSinceCreated > 24 && order.status === 'processing') {
          console.warn(`⚠️ Order ${order.id} stuck for ${hoursSinceCreated.toFixed(1)} hours`);
          results.stuck.push(order.id);
          
          // Send notification
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            type: 'order_delayed',
            title: 'Order delayed',
            message: `Your order is taking longer than expected. Our team is investigating.`,
            data: {
              order_id: order.id,
              hours_stuck: hoursSinceCreated,
            },
          });
        }

        // Apply updates
        if (Object.keys(updates).length > 1) {
          await supabase
            .from('orders')
            .update(updates)
            .eq('id', order.id);
        }

      } catch (error: any) {
        console.error(`❌ Failed to monitor order ${order.id}:`, error);
        results.failed.push({
          orderId: order.id,
          error: error.message,
        });
      }
    }

    console.log('📊 Order monitoring complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        monitored: processingOrders?.length || 0,
        updated: results.updated.length,
        stuck: results.stuck.length,
        failed: results.failed.length,
        details: results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Order monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
