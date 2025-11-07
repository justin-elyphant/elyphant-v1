// ========================================================================
// RETRY AUTO-GIFT PAYMENT - Payment Retry with Grace Period
// ========================================================================
// Runs 3x daily at 10 AM, 4 PM, 10 PM UTC
// Retries failed auto-gift payments with grace period
// Retry schedule: 0h (initial), 12h (retry 1), 36h (retry 2), 72h (retry 3)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting auto-gift payment retry process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Find executions ready for retry
    const { data: executions, error: executionsError } = await supabase
      .from('automated_gift_executions')
      .select(`
        id,
        user_id,
        rule_id,
        recipient_id,
        suggested_products,
        total_amount,
        payment_retry_count,
        last_payment_attempt_at,
        next_payment_retry_at,
        auto_gifting_rules!inner(payment_method_id, budget_limit)
      `)
      .eq('status', 'payment_retry_pending')
      .lte('next_payment_retry_at', new Date().toISOString())
      .lt('payment_retry_count', 3);

    if (executionsError) {
      console.error('❌ Error fetching executions:', executionsError);
      throw executionsError;
    }

    console.log(`📋 Found ${executions?.length || 0} executions ready for retry`);

    const results = {
      total: executions?.length || 0,
      succeeded: 0,
      retrying: 0,
      failed: 0,
      errors: 0,
    };

    for (const execution of (executions || [])) {
      try {
        console.log(`🔄 Retrying payment for execution ${execution.id} (attempt ${execution.payment_retry_count + 1}/3)`);

        const rule = execution.auto_gifting_rules;
        const retryCount = execution.payment_retry_count + 1;

        // Get user's Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', execution.user_id)
          .single();

        if (!profile?.stripe_customer_id) {
          throw new Error('No Stripe customer ID found');
        }

        // Attempt payment
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(execution.total_amount * 100),
          currency: 'usd',
          customer: profile.stripe_customer_id,
          payment_method: rule.payment_method_id,
          confirm: true,
          off_session: true,
          metadata: {
            order_type: 'auto_gift',
            execution_id: execution.id,
            rule_id: execution.rule_id,
            retry_count: retryCount.toString(),
          },
        });

        // Log payment attempt
        await supabase.from('auto_gift_payment_audit').insert({
          execution_id: execution.id,
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          payment_method_id: rule.payment_method_id,
          stripe_response: paymentIntent,
        });

        if (paymentIntent.status === 'succeeded') {
          console.log(`✅ Payment succeeded for execution ${execution.id}`);

          // Update execution - payment succeeded, queue for fulfillment
          await supabase
            .from('automated_gift_executions')
            .update({
              stripe_payment_intent_id: paymentIntent.id,
              payment_status: 'succeeded',
              payment_confirmed_at: new Date().toISOString(),
              payment_retry_count: retryCount,
              last_payment_attempt_at: new Date().toISOString(),
              status: 'approved', // Move back to approved for fulfillment
            })
            .eq('id', execution.id);

          // Invoke approve-auto-gift to complete the order (it will handle fulfillment queue)
          await supabase.functions.invoke('approve-auto-gift', {
            body: {
              executionId: execution.id,
              approvalDecision: 'approved',
              isRetry: true,
            },
          });

          results.succeeded++;

          // Send success notification
          await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'auto_gift_payment_retry_success',
              userId: execution.user_id,
              executionId: execution.id,
              retryCount,
            },
          });
        } else {
          throw new Error(`Payment failed with status: ${paymentIntent.status}`);
        }
      } catch (error) {
        console.error(`❌ Retry failed for execution ${execution.id}:`, error);

        const retryCount = execution.payment_retry_count + 1;
        const maxRetries = 3;

        // Log failed attempt
        await supabase.from('auto_gift_payment_audit').insert({
          execution_id: execution.id,
          payment_intent_id: 'retry_failed',
          status: 'failed',
          amount: Math.round(execution.total_amount * 100),
          error_message: error.message,
        });

        if (retryCount >= maxRetries) {
          // Final failure - mark as failed
          console.log(`❌ Max retries reached for execution ${execution.id} - marking as failed`);

          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              payment_status: 'failed',
              payment_retry_count: retryCount,
              last_payment_attempt_at: new Date().toISOString(),
              payment_error_message: error.message,
            })
            .eq('id', execution.id);

          results.failed++;

          // Send final failure notification
          await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'auto_gift_payment_failed_final',
              userId: execution.user_id,
              executionId: execution.id,
              errorMessage: error.message,
            },
          });
        } else {
          // Schedule next retry (12h, 36h, 72h from initial attempt)
          const retryDelays = [0, 12, 36, 72]; // hours
          const nextRetryHours = retryDelays[retryCount] || 72;
          const nextRetryAt = new Date();
          nextRetryAt.setHours(nextRetryAt.getHours() + (nextRetryHours - retryDelays[retryCount - 1]));

          await supabase
            .from('automated_gift_executions')
            .update({
              payment_retry_count: retryCount,
              last_payment_attempt_at: new Date().toISOString(),
              next_payment_retry_at: nextRetryAt.toISOString(),
              payment_error_message: error.message,
            })
            .eq('id', execution.id);

          results.retrying++;

          // Send retry notification
          await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'auto_gift_payment_retrying',
              userId: execution.user_id,
              executionId: execution.id,
              retryCount,
              nextRetryAt: nextRetryAt.toISOString(),
              errorMessage: error.message,
            },
          });
        }
      }
    }

    console.log('✅ Payment retry process complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment retry process completed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Payment retry process failed:', error);
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
