// ========================================================================
// PROCESS FULFILLMENT QUEUE - Async Order Fulfillment
// ========================================================================
// Runs every 15 minutes
// Processes queued auto-gift orders asynchronously to prevent timeouts
// Decouples payment confirmation from Zinc order placement

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📦 Starting fulfillment queue processing...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get queued fulfillment items (max 50 per run to prevent timeouts)
    const { data: queueItems, error: queueError } = await supabase
      .from('auto_gift_fulfillment_queue')
      .select(`
        id,
        execution_id,
        order_id,
        retry_count,
        orders!inner(id, order_number, user_id, status)
      `)
      .eq('status', 'queued')
      .lt('retry_count', 5)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queueError) {
      console.error('❌ Error fetching queue:', queueError);
      throw queueError;
    }

    console.log(`📋 Found ${queueItems?.length || 0} items in fulfillment queue`);

    const results = {
      total: queueItems?.length || 0,
      processed: 0,
      retrying: 0,
      failed: 0,
      errors: 0,
    };

    for (const item of (queueItems || [])) {
      try {
        console.log(`📦 Processing fulfillment for order ${item.order_id}...`);

        // Mark as processing
        await supabase
          .from('auto_gift_fulfillment_queue')
          .update({
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        // Process the order through Zinc
        const { data: processResult, error: processError } = await supabase.functions.invoke(
          'process-zma-order',
          {
            body: {
              orderId: item.order_id,
              forceProcess: true,
              source: 'fulfillment_queue',
            },
          }
        );

        if (processError) {
          throw new Error(`Process ZMA order failed: ${processError.message}`);
        }

        if (!processResult.success) {
          throw new Error(processResult.error || 'Unknown processing error');
        }

        console.log(`✅ Order ${item.order_id} processed successfully`);

        // Mark as completed
        await supabase
          .from('auto_gift_fulfillment_queue')
          .update({
            status: 'completed',
          })
          .eq('id', item.id);

        // Update execution status
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'completed',
          })
          .eq('id', item.execution_id);

        results.processed++;
      } catch (error) {
        console.error(`❌ Fulfillment failed for item ${item.id}:`, error);

        const retryCount = item.retry_count + 1;
        const maxRetries = 5;

        if (retryCount >= maxRetries) {
          // Max retries reached - mark as failed
          console.log(`❌ Max retries reached for item ${item.id} - marking as failed`);

          await supabase
            .from('auto_gift_fulfillment_queue')
            .update({
              status: 'failed',
              retry_count: retryCount,
              error_message: error.message,
            })
            .eq('id', item.id);

          // Update execution status
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              payment_error_message: `Fulfillment failed after ${maxRetries} attempts: ${error.message}`,
            })
            .eq('id', item.execution_id);

          results.failed++;

          // Send failure notification
          await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'auto_gift_fulfillment_failed',
              userId: item.orders.user_id,
              orderId: item.order_id,
              executionId: item.execution_id,
              errorMessage: error.message,
            },
          });
        } else {
          // Retry - mark as queued again
          console.log(`🔄 Fulfillment failed for item ${item.id} - retry ${retryCount}/${maxRetries}`);

          await supabase
            .from('auto_gift_fulfillment_queue')
            .update({
              status: 'queued',
              retry_count: retryCount,
              error_message: error.message,
            })
            .eq('id', item.id);

          results.retrying++;
        }
      }
    }

    console.log('✅ Fulfillment queue processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fulfillment queue processing completed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fulfillment queue processing failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
