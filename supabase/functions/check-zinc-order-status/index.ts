
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

    const { orderIds, singleOrderId, debugMode = false } = await req.json();
    
    // Handle both single order and array of order IDs
    const orderIdsToCheck = singleOrderId ? [singleOrderId] : (orderIds || []);
    
    if (!orderIdsToCheck || orderIdsToCheck.length === 0) {
      throw new Error('orderIds array or singleOrderId is required');
    }

    console.log(`🔍 Checking status for ${orderIdsToCheck.length} Zinc orders:`, orderIdsToCheck);
    if (debugMode) {
      console.log(`🐛 DEBUG MODE ENABLED - Enhanced logging active`);
    }

    const results = [];
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    for (const zincOrderId of orderIdsToCheck) {
      try {
        console.log(`📡 Making API request to Zinc for order: ${zincOrderId}`);
        
        const requestUrl = `https://api.zinc.io/v1/orders/${zincOrderId}`;
        const requestHeaders = {
          'Authorization': `Basic ${btoa(`${zincApiKey}:`)}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Elyphant-OrderTracker/1.0'
        };

        if (debugMode) {
          console.log(`🐛 Request URL: ${requestUrl}`);
          console.log(`🐛 Request Headers:`, { ...requestHeaders, Authorization: '[REDACTED]' });
        }
        
        // Query Zinc API for order status
        const zincResponse = await fetch(requestUrl, {
          method: 'GET',
          headers: requestHeaders
        });

        if (debugMode) {
          console.log(`🐛 Response Status: ${zincResponse.status} ${zincResponse.statusText}`);
          console.log(`🐛 Response Headers:`, Object.fromEntries(zincResponse.headers.entries()));
        }

        if (zincResponse.ok) {
          const zincOrder = await zincResponse.json();
          console.log(`✅ Zinc order ${zincOrderId} found with status: ${zincOrder.status}`);
          
          if (debugMode) {
            console.log(`🐛 Full Zinc order response:`, JSON.stringify(zincOrder, null, 2));
          }
          
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
            console.error(`❌ Error updating order ${zincOrderId}:`, updateError);
          }

          results.push({
            zincOrderId,
            status: zincOrder.status,
            trackingNumber: zincOrder.tracking_numbers?.[0] || null,
            updated: !updateError,
            fullResponse: debugMode ? zincOrder : undefined,
            createdAt: zincOrder.created_at,
            updatedAt: zincOrder.updated_at,
            retailer: zincOrder.retailer,
            totalPrice: zincOrder.price_total || zincOrder.total_price
          });

        } else if (zincResponse.status === 404) {
          console.log(`❌ Zinc order ${zincOrderId} not found (404) - order may not exist in Zinc system`);
          
          const errorText = await zincResponse.text();
          if (debugMode) {
            console.log(`🐛 404 Response body: ${errorText}`);
          }
          
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
            error: 'Order not found in Zinc system - this indicates the order was never successfully submitted to Zinc',
            httpStatus: 404,
            responseBody: debugMode ? errorText : undefined
          });

        } else if (zincResponse.status === 401) {
          console.log(`🔒 Zinc API authentication failed for order ${zincOrderId} - check API key`);
          
          results.push({
            zincOrderId,
            status: 'auth_error',
            updated: false,
            error: `Zinc API authentication failed - check API key configuration`,
            httpStatus: 401
          });

        } else {
          const errorText = await zincResponse.text();
          console.error(`❌ Zinc API error for order ${zincOrderId} - Status: ${zincResponse.status}, Body: ${errorText}`);
          
          if (debugMode) {
            console.log(`🐛 Error Response Headers:`, Object.fromEntries(zincResponse.headers.entries()));
            console.log(`🐛 Error Response Body: ${errorText}`);
          }
          
          results.push({
            zincOrderId,
            status: 'api_error',
            updated: false,
            error: `Zinc API error: ${zincResponse.status} - ${errorText}`,
            httpStatus: zincResponse.status,
            responseBody: debugMode ? errorText : undefined
          });
        }

      } catch (error) {
        console.error(`💥 Exception checking order ${zincOrderId}:`, error);
        results.push({
          zincOrderId,
          status: 'exception_error',
          updated: false,
          error: `Network/parsing error: ${error.message}`,
          exception: debugMode ? error.stack : undefined
        });
      }
    }

    console.log(`✅ Zinc order status check completed. Results summary:`, 
      results.map(r => `${r.zincOrderId}: ${r.status}`));

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: orderIdsToCheck.length,
        found: results.filter(r => r.status !== 'not_found' && r.status !== 'api_error' && r.status !== 'exception_error').length,
        notFound: results.filter(r => r.status === 'not_found').length,
        errors: results.filter(r => r.status === 'api_error' || r.status === 'exception_error' || r.status === 'auth_error').length,
        updated: results.filter(r => r.updated).length
      },
      debugMode,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('🚨 Error in check-zinc-order-status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
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
