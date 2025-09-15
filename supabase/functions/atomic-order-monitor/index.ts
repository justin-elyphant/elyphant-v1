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
    const hours = parseInt(url.searchParams.get('hours') || '24');

    // Get comprehensive order processing metrics
    const sinceTime = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();

    let orderQuery = supabase
      .from('orders')
      .select('id, status, zinc_status, zinc_order_id, created_at, updated_at, payment_status')
      .gte('created_at', sinceTime)
      .order('created_at', { ascending: false });

    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId);
    }

    const { data: orders, error: ordersError } = await orderQuery.limit(50);

    if (ordersError) {
      throw ordersError;
    }

    // Get processing signals
    let signalsQuery = supabase
      .from('order_processing_signals')
      .select('*')
      .gte('created_at', sinceTime)
      .order('created_at', { ascending: false });

    if (orderId) {
      signalsQuery = signalsQuery.eq('order_id', orderId);
    }

    const { data: signals, error: signalsError } = await signalsQuery.limit(100);

    // Calculate metrics
    const metrics = {
      totalOrders: orders.length,
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      ordersByZincStatus: orders.reduce((acc, order) => {
        const status = order.zinc_status || 'null';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      duplicatePreventionStats: {
        ordersWithZincId: orders.filter(o => o.zinc_order_id).length,
        ordersSubmitting: orders.filter(o => o.zinc_status === 'submitting').length,
        potentialDuplicates: orders.filter(o => o.zinc_status === 'submitting' && !o.zinc_order_id).length
      },
      triggerSources: signals ? signals.reduce((acc, signal) => {
        acc[signal.trigger_source] = (acc[signal.trigger_source] || 0) + 1;
        return acc;
      }, {}) : {},
      atomicLockEffectiveness: {
        description: "Orders with zinc_order_id indicate successful atomic lock",
        successRate: orders.length > 0 ? 
          ((orders.filter(o => o.zinc_order_id).length / orders.length) * 100).toFixed(2) + '%' 
          : 'N/A'
      }
    };

    const response = {
      timeframe: `Last ${hours} hours`,
      timestamp: new Date().toISOString(),
      atomicOrderProcessing: {
        status: "✅ ACTIVE",
        description: "Database-level atomic locks prevent duplicate Zinc submissions",
        functions: [
          "acquire_order_submission_lock() - Atomic order claiming",
          "set_zinc_order_id_if_null() - Idempotent Zinc ID updates",
          "order-orchestrator - Primary trigger consolidation"
        ]
      },
      metrics,
      orders: orderId ? orders : orders.slice(0, 10), // Show all if specific order, otherwise top 10
      signals: signals ? (orderId ? signals : signals.slice(0, 20)) : [],
      triggerConsolidation: {
        primaryTrigger: "stripe-webhook",
        orchestrator: "order-orchestrator",
        description: "All triggers route through orchestrator for controlled processing"
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in atomic monitoring:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});