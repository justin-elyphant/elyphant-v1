import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { 
  PAYMENT_LEAD_TIME_CONFIG, 
  getDaysUntil 
} from '../shared/paymentLeadTime.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎁 Running auto-gift orchestrator (two-stage)...');
    console.log(`⚙️ Config: Payment capture ${PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS} days before event`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Find auto-gifting rules with upcoming events
    const lookAheadDays = Math.max(
      PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS,
      PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS
    );
    const lookAheadDate = new Date();
    lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

    const { data: upcomingRules, error: rulesError } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(*)')
      .eq('is_active', true)
      .lte('scheduled_date', lookAheadDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

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
      let recipientName = 'Recipient';
      
      try {
        console.log(`🎁 Processing auto-gift rule: ${rule.id}`);

        const eventDate = new Date(rule.scheduled_date);
        const daysUntil = getDaysUntil(eventDate);
        recipientName = rule.recipient?.name || rule.recipient?.email || 'Recipient';

        // ============================================
        // NOTIFICATION_LEAD_DAYS before: Send notification (approval required)
        // ============================================
        if (daysUntil === PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS) {
          console.log(`📬 Sending ${PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS}-day notification...`);
          
          await supabase.from('notifications').insert({
            user_id: rule.user_id,
            type: 'auto_gift_upcoming',
            title: `Auto-gift reminder: ${recipientName}'s ${rule.date_type}`,
            message: `Your auto-gift for ${recipientName} is scheduled for ${eventDate.toLocaleDateString()}. Budget: $${rule.budget_limit}`,
            data: {
              rule_id: rule.id,
              recipient_name: recipientName,
              occasion: rule.date_type,
              date: rule.scheduled_date,
              budget: rule.budget_limit,
            },
            action_required: true,
            action_type: 'approve_auto_gift',
          });

          results.notified.push(rule.id);
        }

        // ============================================
        // CAPTURE_LEAD_DAYS before: Create checkout session (capture payment)
        // ============================================
        if (daysUntil === PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS) {
          console.log(`💳 Creating checkout session ${PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS} days before event...`);

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
            .eq('user_id', rule.recipient_id)
            .lte('price', rule.budget_limit)
            .order('priority', { ascending: false })
            .limit(1);

          if (!giftItems || giftItems.length === 0) {
            throw new Error('No suitable gifts found within budget');
          }

          const gift = giftItems[0];
          
          // Get recipient's shipping address from profiles
          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('shipping_address')
            .eq('id', rule.recipient_id)
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
                    name: recipientName,
                    email: rule.recipient?.email,
                    address: recipientProfile?.shipping_address,
                  },
                  items: [{
                    product_id: gift.product_id,
                    quantity: 1,
                  }],
                }],
                scheduledDeliveryDate: rule.scheduled_date,
                isAutoGift: true,
                autoGiftRuleId: rule.id,
                giftOptions: {
                  message: rule.gift_message || `Happy ${rule.date_type}!`,
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
                  occasion: rule.date_type,
                  recipient_name: recipientName,
                  scheduled_for_zinc_submission: rule.scheduled_date,
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
                  recipient: recipientName,
                  payment_captured_at: new Date().toISOString(),
                  scheduled_zinc_submission: rule.scheduled_date,
                },
                metadata: {
                  flow_type: 'two_stage_processing',
                  lead_days: PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS,
                  captured_status: PAYMENT_LEAD_TIME_CONFIG.CAPTURED_STATUS,
                },
              });
          }

          results.checkoutCreated.push(rule.id);
        }

        // ============================================
        // Event day: Track completion (Zinc submission handled by scheduled-order-processor)
        // ============================================
        if (daysUntil <= 0) {
          // Check if order was already submitted
          const { data: execution } = await supabase
            .from('automated_gift_executions')
            .select('order_id, status')
            .eq('rule_id', rule.id)
            .eq('execution_date', rule.scheduled_date)
            .single();

          if (execution?.order_id && execution.status === 'processing') {
            console.log(`✅ Auto-gift order already submitted for rule ${rule.id}`);
            results.submitted.push(rule.id);
          }

          // Update rule timestamp
          await supabase
            .from('auto_gifting_rules')
            .update({
              updated_at: new Date().toISOString(),
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
          message: `Failed to process auto-gift for ${recipientName}: ${error.message}`,
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
          notificationLeadDays: PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS,
          paymentCaptureLeadDays: PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS,
          capturedStatus: PAYMENT_LEAD_TIME_CONFIG.CAPTURED_STATUS,
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
