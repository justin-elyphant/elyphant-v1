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

    // Helper: Calculate next birthday from DOB (supports YYYY-MM-DD, MM-DD, or full ISO)
    const calculateNextBirthday = (dob: string | null): string | null => {
      if (!dob) return null;
      try {
        let month: number, day: number;
        
        // Handle MM-DD format (e.g., "11-26")
        if (dob.length === 5 && dob.includes('-')) {
          const parts = dob.split('-').map(Number);
          month = parts[0] - 1; // JS months are 0-indexed
          day = parts[1];
        } else {
          // Handle full date format (YYYY-MM-DD or ISO)
          const dobDate = new Date(dob);
          month = dobDate.getMonth();
          day = dobDate.getDate();
        }
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const thisYearBirthday = new Date(currentYear, month, day);
        const birthdayToUse = thisYearBirthday >= now 
          ? thisYearBirthday 
          : new Date(currentYear + 1, month, day);
        return birthdayToUse.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    // Helper: Calculate holiday date (simplified version)
    const calculateHolidayDate = (holidayKey: string): string | null => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const holidays: Record<string, { month: number; day: number }> = {
        christmas: { month: 12, day: 25 },
        valentine: { month: 2, day: 14 },
        mothers_day: { month: 5, day: 12 }, // 2nd Sunday approximation
        fathers_day: { month: 6, day: 16 }, // 3rd Sunday approximation
      };
      
      const holiday = holidays[holidayKey];
      if (!holiday) return null;
      
      const holidayDate = new Date(currentYear, holiday.month - 1, holiday.day);
      if (holidayDate < now) {
        holidayDate.setFullYear(currentYear + 1);
      }
      return holidayDate.toISOString().split('T')[0];
    };

    // Find auto-gifting rules with upcoming events
    const lookAheadDays = Math.max(
      PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS,
      PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS
    );
    const lookAheadDate = new Date();
    lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);
    const lookAheadDateStr = lookAheadDate.toISOString().split('T')[0];
    const nowStr = new Date().toISOString().split('T')[0];

    // Primary query: Rules with scheduled_date populated
    const { data: upcomingRules, error: rulesError } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(*)')
      .eq('is_active', true)
      .lte('scheduled_date', lookAheadDateStr)
      .gte('scheduled_date', nowStr)
      .order('scheduled_date', { ascending: true });

    if (rulesError) {
      throw rulesError;
    }

    // Fallback query: Rules with NULL scheduled_date (legacy/needs resolution)
    const { data: unscheduledRules } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(id, name, email, dob)')
      .eq('is_active', true)
      .is('scheduled_date', null);

    // Resolve dates for unscheduled rules and update them
    const resolvedRules: any[] = [];
    for (const rule of unscheduledRules || []) {
      let resolvedDate: string | null = null;
      
      if (rule.date_type === 'birthday' && rule.recipient?.dob) {
        resolvedDate = calculateNextBirthday(rule.recipient.dob);
      } else if (['christmas', 'valentine', 'mothers_day', 'fathers_day'].includes(rule.date_type)) {
        resolvedDate = calculateHolidayDate(rule.date_type);
      }
      
      if (resolvedDate) {
        // Update the rule with the resolved date for future runs
        console.log(`📅 Resolving scheduled_date for rule ${rule.id}: ${resolvedDate}`);
        await supabase
          .from('auto_gifting_rules')
          .update({ scheduled_date: resolvedDate })
          .eq('id', rule.id);
        
        // Check if within look-ahead window
        if (resolvedDate <= lookAheadDateStr && resolvedDate >= nowStr) {
          resolvedRules.push({ ...rule, scheduled_date: resolvedDate });
        }
      }
    }

    // Combine primary and resolved rules
    const allRules = [...(upcomingRules || []), ...resolvedRules];
    console.log(`🎯 Found ${upcomingRules?.length || 0} upcoming + ${resolvedRules.length} resolved = ${allRules.length} total auto-gifts`);

    const results = {
      notified: [] as string[],
      checkoutCreated: [] as string[],
      submitted: [] as string[],
      failed: [] as { ruleId: string; error: string; stage: string }[],
      resolved: resolvedRules.length,
    };

    for (const rule of allRules) {
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
          
          // Use auto_gift_notifications table (correct table name)
          await supabase.from('auto_gift_notifications').insert({
            user_id: rule.user_id,
            notification_type: 'auto_gift_upcoming',
            title: `Auto-gift reminder: ${recipientName}'s ${rule.date_type}`,
            message: `Your auto-gift for ${recipientName} is scheduled for ${eventDate.toLocaleDateString()}. Budget: $${rule.budget_limit}`,
            is_read: false,
            email_sent: false,
            execution_id: null, // Will be linked when execution starts
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
          // First get the recipient's wishlist, then query items
          const { data: wishlist } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', rule.recipient_id)
            .single();

          let giftItems: any[] = [];
          if (wishlist?.id) {
            const { data: items } = await supabase
              .from('wishlist_items')
              .select('*, products:product_id(*)')
              .eq('wishlist_id', wishlist.id)
              .lte('price', rule.budget_limit || 9999)
              .order('priority', { ascending: false })
              .limit(1);
            giftItems = items || [];
          }

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

        // Log failure notification using correct table
        await supabase.from('auto_gift_notifications').insert({
          user_id: rule.user_id,
          notification_type: 'auto_gift_failed',
          title: 'Auto-gift failed',
          message: `Failed to process auto-gift for ${recipientName}: ${error.message}`,
          is_read: false,
          email_sent: false,
          execution_id: null,
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
