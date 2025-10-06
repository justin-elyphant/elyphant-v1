import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZMABalanceResponse {
  success: boolean;
  balance?: number;
  error?: string;
}

interface FundingAlert {
  alert_type: string;
  zma_current_balance: number;
  pending_orders_value: number;
  recommended_transfer_amount: number;
  orders_count_waiting: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[ZMA-FUNDING-STATUS] Starting funding status check...');

    // Step 1: Get current ZMA balance
    const balanceResponse = await supabase.functions.invoke('manage-zma-accounts', {
      body: { action: 'checkBalance' }
    });

    if (balanceResponse.error) {
      throw new Error(`Failed to fetch ZMA balance: ${balanceResponse.error.message}`);
    }

    const balanceData = balanceResponse.data as ZMABalanceResponse;
    const currentBalance = balanceData.balance || 0;

    console.log(`[ZMA-FUNDING-STATUS] Current ZMA balance: $${currentBalance}`);

    // Step 2: Get orders awaiting funding
    const { data: awaitingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, created_at, scheduled_delivery_date')
      .eq('funding_status', 'awaiting_funds')
      .order('created_at', { ascending: true });

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    const ordersCount = awaitingOrders?.length || 0;
    const pendingOrdersValue = awaitingOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    console.log(`[ZMA-FUNDING-STATUS] Found ${ordersCount} orders awaiting funding, total value: $${pendingOrdersValue}`);

    // Step 3: Check if we have enough balance to process orders
    if (currentBalance >= pendingOrdersValue && ordersCount > 0) {
      console.log('[ZMA-FUNDING-STATUS] ✅ Sufficient balance - processing orders...');
      
      // Update orders to funded status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          funding_status: 'funded',
          funding_allocated_at: new Date().toISOString(),
          funding_hold_reason: null
        })
        .eq('funding_status', 'awaiting_funds');

      if (updateError) {
        console.error('[ZMA-FUNDING-STATUS] Failed to update orders:', updateError);
      } else {
        console.log(`[ZMA-FUNDING-STATUS] Updated ${ordersCount} orders to funded status`);
        
        // Trigger process-scheduled-orders to handle them
        await supabase.functions.invoke('process-scheduled-orders', {
          body: { triggerSource: 'funding_status_check' }
        });
      }

      // Resolve any open funding alerts
      await supabase
        .from('zma_funding_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .is('resolved_at', null);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Orders processed successfully',
          ordersProcessed: ordersCount,
          balance: currentBalance
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: If balance insufficient, check if we need to send alert
    if (pendingOrdersValue > currentBalance && ordersCount > 0) {
      console.log('[ZMA-FUNDING-STATUS] ⚠️ Insufficient balance - checking if alert needed...');

      // Check for recent unresolved alerts (within last 24 hours)
      const { data: recentAlerts } = await supabase
        .from('zma_funding_alerts')
        .select('id, alert_sent_at')
        .is('resolved_at', null)
        .gte('alert_sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!recentAlerts || recentAlerts.length === 0) {
        // No recent alert - send new one
        console.log('[ZMA-FUNDING-STATUS] Creating new funding alert...');
        
        const shortfall = pendingOrdersValue - currentBalance;
        const recommendedTransfer = Math.ceil(shortfall * 1.1); // Add 10% buffer

        const alertData: FundingAlert = {
          alert_type: shortfall > currentBalance * 2 ? 'critical_balance' : 'low_balance',
          zma_current_balance: currentBalance,
          pending_orders_value: pendingOrdersValue,
          recommended_transfer_amount: recommendedTransfer,
          orders_count_waiting: ordersCount
        };

        const { error: alertError } = await supabase
          .from('zma_funding_alerts')
          .insert(alertData);

        if (alertError) {
          console.error('[ZMA-FUNDING-STATUS] Failed to create alert:', alertError);
        } else {
          // Trigger email alert
          await supabase.functions.invoke('send-zma-funding-alert', {
            body: alertData
          });
        }
      } else {
        console.log('[ZMA-FUNDING-STATUS] Recent alert exists - skipping duplicate');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Funding alert created',
          balance: currentBalance,
          shortfall: pendingOrdersValue - currentBalance,
          ordersWaiting: ordersCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No action needed
    return new Response(
      JSON.stringify({
        success: true,
        message: 'No action needed',
        balance: currentBalance,
        ordersWaiting: ordersCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ZMA-FUNDING-STATUS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
