import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * retry-awaiting-funds-orders
 * 
 * Manual trigger function to retry orders that were held due to insufficient ZMA balance.
 * Call this after completing a ZMA transfer to process held orders.
 * 
 * Usage: POST /functions/v1/retry-awaiting-funds-orders
 * Optional body: { maxOrders: number } - limit how many orders to retry (default: 10)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const maxOrders = body.maxOrders || 10;

    console.log('🔄 retry-awaiting-funds-orders: Starting retry process...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // STEP 1: Check current ZMA balance
    const { data: zmaAccount, error: zmaError } = await supabase
      .from('zma_accounts')
      .select('account_balance, id')
      .eq('is_default', true)
      .single();

    if (zmaError || !zmaAccount) {
      console.error('❌ Could not fetch ZMA balance:', zmaError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not fetch ZMA balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const currentBalance = zmaAccount.account_balance || 0;
    console.log(`💰 Current ZMA balance: $${currentBalance.toFixed(2)}`);

    // STEP 2: Fetch orders awaiting funds
    const { data: awaitingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, created_at')
      .eq('status', 'awaiting_funds')
      .order('created_at', { ascending: true }) // Process oldest first
      .limit(maxOrders);

    if (ordersError) {
      console.error('❌ Error fetching awaiting orders:', ordersError.message);
      return new Response(
        JSON.stringify({ success: false, error: ordersError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!awaitingOrders || awaitingOrders.length === 0) {
      console.log('✅ No orders awaiting funds');
      return new Response(
        JSON.stringify({ success: true, message: 'No orders awaiting funds', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📋 Found ${awaitingOrders.length} orders awaiting funds`);

    // STEP 3: Calculate total needed
    const ZMA_SAFETY_MARGIN = 50;
    let runningBalance = currentBalance;
    const results: { orderId: string; orderNumber: string; status: string; error?: string }[] = [];

    for (const order of awaitingOrders) {
      const estimatedCost = order.total_amount * 1.30; // 30% buffer
      const requiredForOrder = estimatedCost + ZMA_SAFETY_MARGIN;

      console.log(`\n📦 Order ${order.order_number}: $${order.total_amount} (need $${requiredForOrder.toFixed(2)})`);

      if (runningBalance < requiredForOrder) {
        console.log(`⏭️ Skipping - insufficient balance ($${runningBalance.toFixed(2)} < $${requiredForOrder.toFixed(2)})`);
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          status: 'skipped',
          error: `Insufficient balance: $${runningBalance.toFixed(2)} < $${requiredForOrder.toFixed(2)}`
        });
        continue;
      }

      // STEP 4: Clear funding hold and call process-order-v2
      try {
        // Clear the funding status first
        await supabase.from('orders').update({
          status: 'payment_confirmed', // Reset to payment_confirmed for reprocessing
          funding_status: null,
          funding_hold_reason: null,
          expected_funding_date: null,
          updated_at: new Date().toISOString(),
        }).eq('id', order.id);

        // Call process-order-v2
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-order-v2', {
          body: { orderId: order.id }
        });

        if (processError) {
          throw new Error(processError.message);
        }

        if (processResult?.success) {
          console.log(`✅ Order ${order.order_number} processed successfully`);
          runningBalance -= estimatedCost; // Deduct from running balance
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            status: 'processed'
          });
        } else if (processResult?.awaiting_funds) {
          console.log(`⏳ Order ${order.order_number} still awaiting funds`);
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            status: 'still_awaiting',
            error: 'Still insufficient funds after retry'
          });
        } else {
          throw new Error(processResult?.error || 'Unknown processing error');
        }
      } catch (error: any) {
        console.error(`❌ Error processing order ${order.order_number}:`, error.message);
        
        // Restore awaiting_funds status on error
        await supabase.from('orders').update({
          status: 'awaiting_funds',
          funding_status: 'awaiting_funds',
          funding_hold_reason: `Retry failed: ${error.message}`,
          updated_at: new Date().toISOString(),
        }).eq('id', order.id);

        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          status: 'error',
          error: error.message
        });
      }
    }

    // STEP 5: Resolve any funding alerts if orders were processed
    const processedCount = results.filter(r => r.status === 'processed').length;
    if (processedCount > 0) {
      await supabase
        .from('zma_funding_alerts')
        .update({
          resolved_at: new Date().toISOString(),
        })
        .is('resolved_at', null);
    }

    const summary = {
      success: true,
      zma_balance: currentBalance,
      total_awaiting: awaitingOrders.length,
      processed: processedCount,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    };

    console.log('\n📊 Retry Summary:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ retry-awaiting-funds-orders error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
