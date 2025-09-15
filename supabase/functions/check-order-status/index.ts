import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return new Response(JSON.stringify({
        error: 'Order ID is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get order details with submission history
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        error: 'Order not found',
        orderId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for potential duplicate submissions
    const hasDuplicateRisk = order.zinc_order_id && order.zinc_status === 'submitting';
    
    const response = {
      orderId,
      status: order.status,
      zinc_status: order.zinc_status,
      zinc_order_id: order.zinc_order_id,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      hasDuplicateRisk,
      submissionProtection: {
        atomicLockEnabled: true,
        duplicatePreventionActive: order.zinc_status === 'submitting' && !order.zinc_order_id
      }
    };

    console.log(`📊 Order Status Check: ${orderId} - Status: ${order.status} - Zinc Status: ${order.zinc_status} - Zinc ID: ${order.zinc_order_id || 'none'}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error checking order status:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});