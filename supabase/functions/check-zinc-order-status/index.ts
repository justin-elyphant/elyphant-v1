
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderIds } = await req.json();
    
    if (!orderIds || !Array.isArray(orderIds)) {
      throw new Error('orderIds array is required');
    }

    console.log(`🔍 Checking status for ${orderIds.length} Zinc orders:`, orderIds);

    const results = [];
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    for (const zincOrderId of orderIds) {
      try {
        console.log(`Checking Zinc order: ${zincOrderId}`);
        
        // Query Zinc API for order status
        const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${zincOrderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${zincApiKey}:`)}`,
            'Content-Type': 'application/json'
          }
        });

        if (zincResponse.ok) {
          const zincOrder = await zincResponse.json();
          console.log(`✅ Zinc order ${zincOrderId} status:`, zincOrder.status);
          
          // Update our database with the real status
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
              zinc_status: zincOrder.status,
              status: mapZincStatusToOrderStatus(zincOrder.status),
              tracking_number: zincOrder.tracking_numbers?.[0] || null,
              updated_at: new Date().toISOString()
            })
            .eq('zinc_order_id', zincOrderId);

          if (updateError) {
            console.error(`Error updating order ${zincOrderId}:`, updateError);
          }

          results.push({
            zincOrderId,
            status: zincOrder.status,
            trackingNumber: zincOrder.tracking_numbers?.[0] || null,
            updated: !updateError
          });

        } else if (zincResponse.status === 404) {
          console.log(`❌ Zinc order ${zincOrderId} not found - marking as failed`);
          
          // Order not found in Zinc - mark as failed
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
              status: 'failed',
              zinc_status: 'not_found',
              updated_at: new Date().toISOString()
            })
            .eq('zinc_order_id', zincOrderId);

          results.push({
            zincOrderId,
            status: 'not_found',
            updated: !updateError,
            error: 'Order not found in Zinc system'
          });

        } else {
          const errorText = await zincResponse.text();
          console.error(`Error checking Zinc order ${zincOrderId}:`, errorText);
          
          results.push({
            zincOrderId,
            status: 'error',
            updated: false,
            error: `Zinc API error: ${zincResponse.status}`
          });
        }

      } catch (error) {
        console.error(`Exception checking order ${zincOrderId}:`, error);
        results.push({
          zincOrderId,
          status: 'error',
          updated: false,
          error: error.message
        });
      }
    }

    console.log(`✅ Zinc order status check completed. Results:`, results);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: `Checked ${orderIds.length} orders, ${results.filter(r => r.updated).length} updated successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('🚨 Error in check-zinc-order-status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function mapZincStatusToOrderStatus(zincStatus: string): string {
  switch (zincStatus?.toLowerCase()) {
    case 'placed':
    case 'confirmed':
      return 'processing';
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'processing';
  }
}
