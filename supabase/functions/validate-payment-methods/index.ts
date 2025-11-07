// ========================================================================
// VALIDATE PAYMENT METHODS - Auto-Gift Payment Health Monitoring
// ========================================================================
// Runs daily at 8 AM UTC (before auto-gift processing at 9 AM)
// Validates Stripe payment methods for all active auto-gift rules
// Updates payment_method_status: valid, expired, invalid, detached

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoGiftRule {
  id: string;
  user_id: string;
  payment_method_id: string;
  payment_method_status: string;
  budget_limit: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting payment method validation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get all active auto-gift rules with payment methods
    const { data: rules, error: rulesError } = await supabase
      .from('auto_gifting_rules')
      .select('id, user_id, payment_method_id, payment_method_status, budget_limit')
      .eq('is_active', true)
      .not('payment_method_id', 'is', null);

    if (rulesError) {
      console.error('❌ Error fetching rules:', rulesError);
      throw rulesError;
    }

    console.log(`📋 Found ${rules?.length || 0} active rules to validate`);

    const results = {
      total: rules?.length || 0,
      valid: 0,
      expired: 0,
      invalid: 0,
      detached: 0,
      errors: 0,
      notificationsQueued: [] as string[],
    };

    // Validate each payment method
    for (const rule of (rules || [])) {
      try {
        console.log(`🔍 Validating payment method for rule ${rule.id}...`);

        // Retrieve payment method from Stripe
        const paymentMethod = await stripe.paymentMethods.retrieve(rule.payment_method_id);

        let status = 'valid';
        let errorMessage: string | null = null;
        let shouldNotify = false;

        // Check if payment method is attached to a customer
        if (!paymentMethod.customer) {
          status = 'detached';
          errorMessage = 'Payment method is not attached to a customer';
          shouldNotify = true;
          results.detached++;
        }
        // Check if card is expired
        else if (paymentMethod.type === 'card' && paymentMethod.card) {
          const expMonth = paymentMethod.card.exp_month;
          const expYear = paymentMethod.card.exp_year;
          const now = new Date();
          const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
          const currentYear = now.getFullYear();

          // Check if expired
          if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            status = 'expired';
            errorMessage = `Card expired ${expMonth}/${expYear}`;
            shouldNotify = true;
            results.expired++;
          }
          // Check if expiring within 30 days
          else {
            const expirationDate = new Date(expYear, expMonth - 1, 1);
            const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
              // Card is valid but expiring soon - send proactive notification
              console.log(`⚠️ Card expiring in ${daysUntilExpiration} days for rule ${rule.id}`);
              shouldNotify = true;
              errorMessage = `Card expires in ${daysUntilExpiration} days`;
              
              // Queue expiring notification
              results.notificationsQueued.push(rule.user_id);
              
              // Send notification via email orchestrator
              await supabase.functions.invoke('ecommerce-email-orchestrator', {
                body: {
                  eventType: 'payment_method_expiring',
                  userId: rule.user_id,
                  ruleId: rule.id,
                  expirationDate: `${expMonth}/${expYear}`,
                  daysRemaining: daysUntilExpiration,
                },
              });
            }
            
            status = 'valid';
            results.valid++;
          }
        } else {
          status = 'valid';
          results.valid++;
        }

        // Update rule with validation results
        const { error: updateError } = await supabase
          .from('auto_gifting_rules')
          .update({
            payment_method_status: status,
            payment_method_last_verified: new Date().toISOString(),
            payment_method_validation_error: errorMessage,
          })
          .eq('id', rule.id);

        if (updateError) {
          console.error(`❌ Error updating rule ${rule.id}:`, updateError);
          results.errors++;
        }

        // Send notification for invalid/expired/detached
        if (shouldNotify && status !== 'valid') {
          console.log(`📧 Queueing notification for user ${rule.user_id} - status: ${status}`);
          results.notificationsQueued.push(rule.user_id);

          await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'payment_method_invalid',
              userId: rule.user_id,
              ruleId: rule.id,
              status,
              errorMessage,
            },
          });
        }

        console.log(`✅ Rule ${rule.id}: ${status}`);
      } catch (error) {
        console.error(`❌ Error validating rule ${rule.id}:`, error);
        results.errors++;

        // Mark as invalid if we can't retrieve it
        await supabase
          .from('auto_gifting_rules')
          .update({
            payment_method_status: 'invalid',
            payment_method_last_verified: new Date().toISOString(),
            payment_method_validation_error: error.message,
          })
          .eq('id', rule.id);

        results.invalid++;
      }
    }

    console.log('✅ Payment method validation complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment method validation completed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Payment method validation failed:', error);
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
