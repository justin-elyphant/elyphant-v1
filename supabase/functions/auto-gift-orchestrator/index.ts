import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Payment capture lead time - start checkout this many days before event
const PAYMENT_CAPTURE_LEAD_DAYS = 4;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎁 Running auto-gift orchestrator (two-stage)...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Find auto-gifting rules with upcoming events
    // 7 days for notification, PAYMENT_CAPTURE_LEAD_DAYS for payment capture
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: upcomingRules, error: rulesError } = await supabase
      .from('auto_gifting_rules')
      .select('*, connections(*)')
      .eq('is_active', true)
      .lte('next_trigger_date', sevenDaysFromNow.toISOString().split('T')[0])
      .order('next_trigger_date', { ascending: true });

    if (rulesError) {
      throw rulesError;
    }

    console.log(`🎯 Found ${upcomingRules?.length || 0} upcoming auto-gifts`);

    const results = {
      notified: [] as string[],
      checkoutCreated: [] as string[],
      submitted: [] as string[],
      failed: [] as { ruleId: string; error: string; stage: string }[],
    };

    for (const rule of upcomingRules || []) {
      try {
        console.log(`🎁 Processing auto-gift rule: ${rule.id}`);

        const eventDate = new Date(rule.next_trigger_date);
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // ============================================
        // 7 days before: Send notification (approval required)
        // ============================================
        if (daysUntil === 7) {
          console.log('📬 Sending 7-day notification...');
          
          await supabase.from('notifications').insert({
            user_id: rule.user_id,
            type: 'auto_gift_upcoming',
            title: `Auto-gift reminder: ${rule.connections?.name}'s ${rule.occasion_type}`,
            message: `Your auto-gift for ${rule.connections?.name} is scheduled for ${eventDate.toLocaleDateString()}. Budget: $${rule.budget_limit}`,
            data: {
              rule_id: rule.id,
              recipient_name: rule.connections?.name,
              occasion: rule.occasion_type,
              date: rule.next_trigger_date,
              budget: rule.budget_limit,
            },
            action_required: true,
            action_type: 'approve_auto_gift',
          });

          results.notified.push(rule.id);
        }

        // ============================================
        // PAYMENT_CAPTURE_LEAD_DAYS before: Create checkout session (capture payment)
        // ============================================
        if (daysUntil === PAYMENT_CAPTURE_LEAD_DAYS && rule.approval_status === 'approved') {
          console.log(`💳 Creating checkout session ${PAYMENT_CAPTURE_LEAD_DAYS} days before event...`);

          // Get saved payment method
          const { data: paymentMethod } = await supabase
            .from('payment_methods')
            .select('stripe_payment_method_id')
            .eq('id', rule.payment_method_id)
            .single();

          if (!paymentMethod) {
            throw new Error('Payment method not found');
          }

          // Get gift suggestions or wishlist items
          const { data: giftItems } = await supabase
            .from('wishlist_items')
            .select('*, products(*)')
            .eq('connection_id', rule.connection_id)
            .lte('price', rule.budget_limit)
            .order('priority', { ascending: false })
            .limit(1);

          if (!giftItems || giftItems.length === 0) {
            throw new Error('No suitable gifts found within budget');
          }

          const gift = giftItems[0];
          
          // Get recipient's shipping address
          const { data: connection } = await supabase
            .from('connections')
            .select('shipping_address')
            .eq('id', rule.connection_id)
            .single();

          console.log('💳 Creating checkout session for auto-gift with saved payment method...');
          
          // Create checkout session - payment captured now, fulfillment on event date
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
            'create-checkout-session',
            {
              body: {
                cartItems: [{
                  product_id: gift.product_id,
                  product_name: gift.products.name,
                  quantity: 1,
                  price: gift.products.price,
                  image_url: gift.products.image,
                }],
                deliveryGroups: [{
                  recipient: {
                    name: rule.connections?.name || 'Recipient',
                    email: rule.connections?.email,
                    address: connection?.shipping_address,
                  },
                  items: [{
                    product_id: gift.product_id,
                    quantity: 1,
                  }],
                }],
                scheduledDeliveryDate: rule.next_trigger_date,
                isAutoGift: true,
                autoGiftRuleId: rule.id,
                giftOptions: {
                  message: rule.gift_message || `Happy ${rule.occasion_type}!`,
                  isGift: true,
                  giftWrap: true,
                },
                paymentMethod: paymentMethod.stripe_payment_method_id,
                confirm: true,
                pricingBreakdown: {
                  subtotal: gift.products.price,
                  shippingCost: 0,
                  giftingFee: 0,
                  taxAmount: 0,
                  total: gift.products.price,
                },
                metadata: {
                  user_id: rule.user_id,
                  is_auto_gift: 'true',
                  auto_gift_rule_id: rule.id,
                  occasion: rule.occasion_type,
                  recipient_name: rule.connections?.name,
                  scheduled_for_zinc_submission: rule.next_trigger_date,
                },
              },
            }
          );

          if (checkoutError) {
            console.error('❌ Checkout session creation failed:', checkoutError);
            throw checkoutError;
          }

          console.log('✅ Checkout session created:', checkoutData?.sessionId);

          // Log the checkout session
          if (checkoutData?.sessionId) {
            await supabase
              .from('auto_gift_event_logs')
              .insert({
                user_id: rule.user_id,
                rule_id: rule.id,
                event_type: 'checkout_session_created',
                event_data: {
                  checkout_session_id: checkoutData.sessionId,
                  amount: gift.products.price,
                  recipient: rule.connections?.name,
                  payment_captured_at: new Date().toISOString(),
                  scheduled_zinc_submission: rule.next_trigger_date,
                },
                metadata: {
                  flow_type: 'two_stage_processing',
                  lead_days: PAYMENT_CAPTURE_LEAD_DAYS,
                },
              });
          }

          results.checkoutCreated.push(rule.id);
        }

        // ============================================
        // Event day: Submit to Zinc (orders are in payment_confirmed status)
        // Note: This is handled by scheduled-order-processor for unified logic
        // But we track completion here
        // ============================================
        if (daysUntil <= 0) {
          // Check if order was already submitted
          const { data: execution } = await supabase
            .from('automated_gift_executions')
            .select('order_id, status')
            .eq('rule_id', rule.id)
            .eq('execution_date', rule.next_trigger_date)
            .single();

          if (execution?.order_id && execution.status === 'processing') {
            console.log(`✅ Auto-gift order already submitted for rule ${rule.id}`);
            results.submitted.push(rule.id);
          }

          // Update rule for next execution
          await supabase
            .from('auto_gifting_rules')
            .update({
              last_executed_at: new Date().toISOString(),
              execution_count: (rule.execution_count || 0) + 1,
              approval_status: null,
            })
            .eq('id', rule.id);
        }

      } catch (error: any) {
        console.error(`❌ Failed to process auto-gift rule ${rule.id}:`, error);
        results.failed.push({
          ruleId: rule.id,
          error: error.message,
          stage: 'processing',
        });

        await supabase.from('notifications').insert({
          user_id: rule.user_id,
          type: 'auto_gift_failed',
          title: 'Auto-gift failed',
          message: `Failed to process auto-gift for ${rule.connections?.name}: ${error.message}`,
          data: {
            rule_id: rule.id,
            error: error.message,
          },
        });
      }
    }

    console.log('📊 Auto-gift orchestration complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        notified: results.notified.length,
        checkoutCreated: results.checkoutCreated.length,
        submitted: results.submitted.length,
        failed: results.failed.length,
        details: results,
        config: {
          paymentCaptureLeadDays: PAYMENT_CAPTURE_LEAD_DAYS,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Auto-gift orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
