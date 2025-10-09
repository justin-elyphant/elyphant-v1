import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 Unified Order Monitor - Starting comprehensive check...');
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    const summary = {
      payment_verification_recovery: { found: 0, recovered: 0, skipped: 0 },
      retry_pending_processing: { found: 0, successful: 0, failed: 0 },
      timeout_detection: { found: 0, fixed: 0, failed: 0 },
      missing_zma_processing: { found: 0, triggered: 0 },
      execution_time: new Date().toISOString()
    };

    // ========== SCENARIO 1: Payment Verification Recovery ==========
    console.log('🔄 [1/4] Checking payment_verification_failed orders...');
    
    const { data: stuckOrders } = await supabase
      .from('orders')
      .select('id, order_number, stripe_payment_intent_id, stripe_session_id, created_at')
      .eq('status', 'payment_verification_failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(20);

    summary.payment_verification_recovery.found = stuckOrders?.length || 0;

    for (const order of stuckOrders || []) {
      if (!order.stripe_payment_intent_id) {
        summary.payment_verification_recovery.skipped++;
        continue;
      }

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
        
        if (paymentIntent.status === 'succeeded') {
          console.log(`✅ Recovering order ${order.order_number} (payment succeeded)`);
          
          await supabase
            .from('orders')
            .update({
              status: 'processing',
              payment_status: 'succeeded',
              stripe_session_id: order.stripe_session_id || `recovered_${Date.now()}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          await supabase.from('order_recovery_logs').insert({
            order_id: order.id,
            recovery_type: 'payment_verification_recovery',
            recovery_status: 'completed',
            metadata: { stripe_payment_intent_id: order.stripe_payment_intent_id }
          });

          // Trigger ZMA processing
          await supabase.functions.invoke('process-zma-order', {
            body: { orderId: order.id, isTestMode: false, debugMode: false }
          });

          summary.payment_verification_recovery.recovered++;
        } else {
          summary.payment_verification_recovery.skipped++;
        }
      } catch (error) {
        console.error(`❌ Error recovering order ${order.id}:`, error);
        summary.payment_verification_recovery.skipped++;
      }
    }

    // ========== SCENARIO 2: Retry Pending Orders ==========
    console.log('🔄 [2/4] Processing retry_pending orders...');
    
    const { data: retryOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'retry_pending')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    summary.retry_pending_processing.found = retryOrders?.length || 0;

    for (const order of retryOrders || []) {
      try {
        // Safety check: Skip if already has zinc_order_id
        if (order.zinc_order_id && order.zinc_status !== 'failed') {
          console.log(`⚠️ Order ${order.id} already has zinc_order_id - marking as processing`);
          
          await supabase
            .from('orders')
            .update({
              status: 'processing',
              zinc_status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
          
          summary.retry_pending_processing.successful++;
          continue;
        }

        // Retry the order
        const { data, error } = await supabase.functions.invoke('process-zma-order', {
          body: {
            orderId: order.id,
            isTestMode: false,
            debugMode: false,
            retryAttempt: true
          }
        });

        if (error || !data?.success) {
          const newRetryCount = (order.retry_count || 0) + 1;
          
          if (newRetryCount >= 3) {
            // Max retries exceeded
            await supabase
              .from('orders')
              .update({
                status: 'failed',
                zinc_status: 'max_retries_exceeded',
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
          } else {
            // Schedule next retry
            const delays = [3600, 14400, 43200];
            const nextRetryDelay = delays[newRetryCount - 1] || 43200;
            
            await supabase
              .from('orders')
              .update({
                retry_count: newRetryCount,
                next_retry_at: new Date(Date.now() + (nextRetryDelay * 1000)).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
          }
          
          summary.retry_pending_processing.failed++;
        } else {
          summary.retry_pending_processing.successful++;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error processing retry for order ${order.id}:`, error);
        summary.retry_pending_processing.failed++;
      }
    }

    // ========== SCENARIO 3: Timeout Detection ==========
    console.log('🔄 [3/4] Checking for stuck orders (timeout detection)...');
    
    const { data: timeoutOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, updated_at, retry_count, zinc_status')
      .eq('status', 'processing')
      .eq('zinc_status', 'submitted')
      .lt('updated_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true });

    summary.timeout_detection.found = timeoutOrders?.length || 0;

    for (const order of timeoutOrders || []) {
      try {
        const retryCount = order.retry_count || 0;
        const delays = [1800, 3600, 14400];
        const delaySeconds = delays[retryCount] || 43200;
        const nextRetryAt = new Date(Date.now() + (delaySeconds * 1000));

        await supabase
          .from('orders')
          .update({
            status: 'retry_pending',
            next_retry_at: nextRetryAt.toISOString(),
            updated_at: new Date().toISOString(),
            retry_reason: 'timeout_recovery'
          })
          .eq('id', order.id);

        console.log(`✅ Fixed stuck order ${order.order_number}`);
        summary.timeout_detection.fixed++;

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error fixing timeout for order ${order.id}:`, error);
        summary.timeout_detection.failed++;
      }
    }

    // ========== SCENARIO 4: Missing ZMA Processing ==========
    console.log('🔄 [4/4] Checking for orders missing ZMA processing...');
    
    const { data: missingZmaOrders } = await supabase
      .from('orders')
      .select('id, order_number, created_at')
      .eq('status', 'processing')
      .eq('payment_status', 'succeeded')
      .is('zinc_order_id', null)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .limit(10);

    summary.missing_zma_processing.found = missingZmaOrders?.length || 0;

    for (const order of missingZmaOrders || []) {
      try {
        await supabase.functions.invoke('process-zma-order', {
          body: { orderId: order.id, isTestMode: false, debugMode: false }
        });
        
        console.log(`✅ Triggered ZMA for missing order ${order.order_number}`);
        summary.missing_zma_processing.triggered++;
      } catch (error) {
        console.error(`❌ Error triggering ZMA for order ${order.id}:`, error);
      }
    }

    // Log summary to audit log if any issues were found or fixed
    const totalIssues = summary.payment_verification_recovery.found + 
                       summary.retry_pending_processing.found + 
                       summary.timeout_detection.found + 
                       summary.missing_zma_processing.found;

    if (totalIssues > 0) {
      await supabase.from('admin_audit_log').insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'unified_monitor_run',
        target_type: 'order_batch',
        target_id: '00000000-0000-0000-0000-000000000000',
        action_details: {
          message: `Unified monitor processed ${totalIssues} total orders`,
          summary,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('✅ Unified Order Monitor completed:', summary);

    return new Response(JSON.stringify({
      success: true,
      message: 'Unified order monitoring complete',
      healthStatus: totalIssues > 0 ? 'issues_found_and_processed' : 'healthy',
      summary,
      checkedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Unified monitor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
      healthStatus: 'error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
