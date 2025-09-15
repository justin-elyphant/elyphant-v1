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

    const body = await req.json();
    const { orderId, triggerSource = 'unknown', metadata = {} } = body;

    console.log(`🚀 ORDER ORCHESTRATOR: Order ${orderId} signaled by ${triggerSource}`);
    console.log(`📊 Signal metadata:`, JSON.stringify(metadata, null, 2));

    if (!orderId) {
      return new Response(JSON.stringify({
        error: 'Order ID is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log the trigger attempt
    await supabase
      .from('order_processing_signals')
      .insert({
        order_id: orderId,
        trigger_source: triggerSource,
        signal_metadata: metadata,
        processed_at: new Date().toISOString()
      })
      .onError((error) => console.log('Non-critical: Failed to log signal:', error));

    // Get current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, zinc_status, zinc_order_id, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`❌ Order ${orderId} not found:`, orderError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found',
        orderId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if order needs processing
    const needsProcessing = 
      order.payment_status === 'succeeded' &&
      !order.zinc_order_id &&
      order.zinc_status !== 'submitting' &&
      !['completed', 'cancelled', 'shipped'].includes(order.status);

    if (!needsProcessing) {
      console.log(`🔍 Order ${orderId} doesn't need processing:`, {
        payment_status: order.payment_status,
        zinc_order_id: order.zinc_order_id,
        zinc_status: order.zinc_status,
        status: order.status
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Order already processed or not ready for processing',
        orderId,
        currentStatus: order.status,
        zincStatus: order.zinc_status,
        processed: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Primary trigger logic: Only stripe-webhook gets priority
    const isPrimaryTrigger = triggerSource === 'stripe-webhook';
    const delayMs = isPrimaryTrigger ? 0 : 2000; // Secondary triggers wait 2 seconds

    if (!isPrimaryTrigger) {
      console.log(`⏳ Secondary trigger ${triggerSource} waiting ${delayMs}ms for primary trigger...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Call process-zma-order with orchestrator metadata
    console.log(`🚀 ORCHESTRATOR: Invoking process-zma-order for ${orderId} from ${triggerSource}`);
    
    const { data: result, error: processError } = await supabase.functions.invoke('process-zma-order', {
      body: {
        orderId,
        triggerSource,
        orchestratorMetadata: {
          originalTrigger: triggerSource,
          isPrimary: isPrimaryTrigger,
          processedAt: new Date().toISOString()
        },
        ...metadata
      }
    });

    if (processError) {
      console.error(`❌ Failed to process order ${orderId}:`, processError);
      throw processError;
    }

    console.log(`✅ ORCHESTRATOR: Order ${orderId} processing completed by ${triggerSource}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Order processing orchestrated successfully',
      orderId,
      triggerSource,
      isPrimaryTrigger,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 ORDER ORCHESTRATOR ERROR:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});