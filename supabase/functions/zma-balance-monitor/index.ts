import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * zma-balance-monitor
 * 
 * Cron job that runs daily at 9 AM to check ZMA balance and send alerts.
 * Thresholds:
 * - LOW_BALANCE: $1,000 - sends warning email
 * - CRITICAL: $500 - sends critical alert email
 * 
 * Prevents duplicate alerts by checking zma_funding_alerts table for recent alerts.
 */

const ZMA_LOW_BALANCE_THRESHOLD = 1000;
const ZMA_CRITICAL_THRESHOLD = 500;
const ALERT_COOLDOWN_HOURS = 24;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 zma-balance-monitor: Starting balance check...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // STEP 1: Fetch current ZMA balance
    const { data: zmaAccount, error: zmaError } = await supabase
      .from('zma_accounts')
      .select('account_balance, id, last_balance_check')
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

    // STEP 2: Calculate pending orders value
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('id, total_amount')
      .in('status', ['payment_confirmed', 'processing', 'awaiting_funds']);

    if (pendingError) {
      console.error('⚠️ Error fetching pending orders:', pendingError.message);
    }

    const pendingValue = pendingOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const ordersAwaitingFunds = pendingOrders?.filter(o => true).length || 0; // All pending count
    
    // Count specifically awaiting_funds orders
    const { count: awaitingFundsCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'awaiting_funds');

    console.log(`📦 Pending orders value: $${pendingValue.toFixed(2)} | Awaiting funds: ${awaitingFundsCount}`);

    // STEP 3: Determine alert type
    let alertType: 'low_balance' | 'critical_balance' | 'pending_orders_waiting' | null = null;
    
    if ((awaitingFundsCount || 0) > 0) {
      alertType = 'pending_orders_waiting';
    } else if (currentBalance < ZMA_CRITICAL_THRESHOLD) {
      alertType = 'critical_balance';
    } else if (currentBalance < ZMA_LOW_BALANCE_THRESHOLD) {
      alertType = 'low_balance';
    }

    if (!alertType) {
      console.log('✅ ZMA balance is healthy, no alert needed');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Balance healthy', 
          balance: currentBalance,
          pending_value: pendingValue,
          threshold: ZMA_LOW_BALANCE_THRESHOLD
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // STEP 4: Check for recent alerts (cooldown period)
    const cooldownTime = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
    
    const { data: recentAlert, error: alertCheckError } = await supabase
      .from('zma_funding_alerts')
      .select('id, created_at')
      .eq('alert_type', alertType)
      .gte('created_at', cooldownTime)
      .is('resolved_at', null)
      .maybeSingle();

    if (recentAlert) {
      console.log(`⏭️ Alert already sent within ${ALERT_COOLDOWN_HOURS}h, skipping duplicate`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alert already sent recently',
          alert_type: alertType,
          last_alert: recentAlert.created_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // STEP 5: Calculate recommended transfer amount
    const ZMA_BUFFER = 500;
    const recommendedTransfer = Math.max(0, (pendingValue * 1.30 + ZMA_BUFFER) - currentBalance);

    console.log(`⚠️ Alert triggered: ${alertType} | Recommended transfer: $${recommendedTransfer.toFixed(2)}`);

    // STEP 6: Record alert
    const { error: insertError } = await supabase.from('zma_funding_alerts').insert({
      alert_type: alertType,
      zma_current_balance: currentBalance,
      pending_orders_value: pendingValue,
      recommended_transfer_amount: recommendedTransfer,
      orders_count_waiting: awaitingFundsCount || 0,
      email_sent: true,
    });

    if (insertError) {
      console.error('⚠️ Error recording alert:', insertError.message);
    }

    // STEP 7: Queue email alert
    const emailContent = {
      recipient_email: 'admin@elyphant.ai',
      event_type: 'zma_low_balance_alert',
      template_variables: {
        current_balance: currentBalance,
        threshold: alertType === 'critical_balance' ? ZMA_CRITICAL_THRESHOLD : ZMA_LOW_BALANCE_THRESHOLD,
        pending_orders_value: pendingValue,
        orders_waiting: awaitingFundsCount || 0,
        recommended_transfer: recommendedTransfer,
        is_critical: alertType === 'critical_balance',
        has_waiting_orders: (awaitingFundsCount || 0) > 0,
        alert_type: alertType,
      },
      status: 'pending',
      priority: alertType === 'critical_balance' ? 'high' : 'normal',
    };

    const { error: emailError } = await supabase.from('email_queue').insert(emailContent);

    if (emailError) {
      console.error('⚠️ Error queueing email:', emailError.message);
    } else {
      console.log('📧 Alert email queued successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        alert_sent: true,
        alert_type: alertType,
        balance: currentBalance,
        pending_value: pendingValue,
        orders_waiting: awaitingFundsCount || 0,
        recommended_transfer: recommendedTransfer,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ zma-balance-monitor error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
