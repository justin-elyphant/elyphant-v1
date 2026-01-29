import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
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
    const body = await req.json().catch(() => ({}));
    const simulatedDate = body.simulatedDate ? new Date(body.simulatedDate) : new Date();
    
    console.log('🎁 Running simplified auto-gift orchestrator...');
    console.log(`📅 Using date: ${simulatedDate.toISOString().split('T')[0]} ${body.simulatedDate ? '(SIMULATED)' : '(today)'}`);
    console.log(`⚙️ Config: Notification ${PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS}d, Capture ${PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS}d before event`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Helper: Calculate next occurrence of birthday from DOB
    const calculateNextBirthday = (dob: string | null, referenceDate: Date): string | null => {
      if (!dob) return null;
      try {
        let month: number, day: number;
        
        if (dob.length === 5 && dob.includes('-')) {
          const parts = dob.split('-').map(Number);
          month = parts[0] - 1;
          day = parts[1];
        } else {
          const dobDate = new Date(dob);
          month = dobDate.getMonth();
          day = dobDate.getDate();
        }
        
        const currentYear = referenceDate.getFullYear();
        const thisYearBirthday = new Date(currentYear, month, day);
        const birthdayToUse = thisYearBirthday >= referenceDate 
          ? thisYearBirthday 
          : new Date(currentYear + 1, month, day);
        return birthdayToUse.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    // Helper: Calculate next holiday date
    const calculateHolidayDate = (holidayKey: string, referenceDate: Date): string | null => {
      const currentYear = referenceDate.getFullYear();
      
      const holidays: Record<string, { month: number; day: number }> = {
        christmas: { month: 12, day: 25 },
        valentine: { month: 2, day: 14 },
        mothers_day: { month: 5, day: 12 },
        fathers_day: { month: 6, day: 16 },
      };
      
      const holiday = holidays[holidayKey];
      if (!holiday) return null;
      
      const holidayDate = new Date(currentYear, holiday.month - 1, holiday.day);
      if (holidayDate < referenceDate) {
        holidayDate.setFullYear(currentYear + 1);
      }
      return holidayDate.toISOString().split('T')[0];
    };

    // Find auto-gifting rules with upcoming events within notification window
    const lookAheadDays = PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS;
    const lookAheadDate = new Date(simulatedDate);
    lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);
    const lookAheadDateStr = lookAheadDate.toISOString().split('T')[0];
    const nowStr = simulatedDate.toISOString().split('T')[0];

    // Query rules with scheduled_date populated
    const { data: upcomingRules, error: rulesError } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(*)')
      .eq('is_active', true)
      .lte('scheduled_date', lookAheadDateStr)
      .gte('scheduled_date', nowStr)
      .order('scheduled_date', { ascending: true });

    if (rulesError) throw rulesError;

    // Fallback: Resolve dates for rules with NULL scheduled_date
    const { data: unscheduledRules } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(id, name, email, dob)')
      .eq('is_active', true)
      .is('scheduled_date', null);

    const resolvedRules: any[] = [];
    for (const rule of unscheduledRules || []) {
      let resolvedDate: string | null = null;
      
      if (rule.date_type === 'birthday' && rule.recipient?.dob) {
        resolvedDate = calculateNextBirthday(rule.recipient.dob, simulatedDate);
      } else if (['christmas', 'valentine', 'mothers_day', 'fathers_day'].includes(rule.date_type)) {
        resolvedDate = calculateHolidayDate(rule.date_type, simulatedDate);
      }
      
      if (resolvedDate) {
        console.log(`📅 Resolving scheduled_date for rule ${rule.id}: ${resolvedDate}`);
        await supabase
          .from('auto_gifting_rules')
          .update({ scheduled_date: resolvedDate })
          .eq('id', rule.id);
        
        if (resolvedDate <= lookAheadDateStr && resolvedDate >= nowStr) {
          resolvedRules.push({ ...rule, scheduled_date: resolvedDate });
        }
      }
    }

    const allRules = [...(upcomingRules || []), ...resolvedRules];
    console.log(`🎯 Found ${allRules.length} auto-gift rules in window (${upcomingRules?.length || 0} scheduled + ${resolvedRules.length} resolved)`);

    const results = {
      notified: [] as string[],
      checkoutCreated: [] as string[],
      failed: [] as { ruleId: string; error: string }[],
      resolved: resolvedRules.length,
    };

    for (const rule of allRules) {
      try {
        const eventDate = new Date(rule.scheduled_date);
        const daysUntil = getDaysUntil(eventDate, simulatedDate);
        const recipientName = rule.recipient?.name || rule.recipient?.email || 'Recipient';

        console.log(`🎁 Processing rule ${rule.id}: ${recipientName}'s ${rule.date_type} in ${daysUntil} days`);

        // ============================================
        // T-7: Notification stage - get wishlist items, queue for approval
        // ============================================
        if (daysUntil === PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS) {
          console.log(`📬 Sending ${PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS}-day notification...`);
          
          // Get wishlist items within budget for suggestion
          let suggestedProducts: any[] = [];
          if (rule.recipient_id) {
            const { data: wishlist } = await supabase
              .from('wishlists')
              .select('id')
              .eq('user_id', rule.recipient_id)
              .single();

            if (wishlist?.id) {
              const { data: wishlistItems } = await supabase
                .from('wishlist_items')
                .select('product_id, name, title, price, image_url')
                .eq('wishlist_id', wishlist.id)
                .lte('price', rule.budget_limit || 9999)
                .order('price', { ascending: false })
                .limit(3);

              suggestedProducts = (wishlistItems || []).map(item => ({
                product_id: item.product_id,
                name: item.name || item.title || 'Gift Item',
                price: item.price,
                image_url: item.image_url,
              }));
            }
          }

          console.log(`🎁 Found ${suggestedProducts.length} suggested products within $${rule.budget_limit} budget`);

          // Trigger notification email
          const { data: userData } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', rule.user_id)
            .single();

          if (userData?.email) {
            await supabase.functions.invoke('ecommerce-email-orchestrator', {
              body: {
                eventType: 'auto_gift_approval',
                recipientEmail: userData.email,
                data: {
                  first_name: userData.name?.split(' ')[0] || 'there',
                  recipient_name: recipientName,
                  occasion: rule.date_type.replace(/_/g, ' '),
                  execution_date: eventDate.toLocaleDateString(),
                  suggested_gifts: suggestedProducts.slice(0, 3),
                  budget: rule.budget_limit,
                  rule_id: rule.id,
                }
              }
            });
            console.log(`📧 Notification email sent to ${userData.email}`);
          }

          // Log the notification event
          await supabase.from('auto_gift_event_logs').insert({
            user_id: rule.user_id,
            rule_id: rule.id,
            event_type: 'notification_sent',
            event_data: {
              days_until: daysUntil,
              recipient_name: recipientName,
              occasion: rule.date_type,
              suggested_products: suggestedProducts.length,
              budget: rule.budget_limit,
            },
            metadata: { simulated: !!body.simulatedDate },
          });

          results.notified.push(rule.id);
        }

        // ============================================
        // T-4: Payment capture stage - create checkout session
        // This creates an order that flows through scheduled-order-processor
        // ============================================
        if (daysUntil === PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS) {
          console.log(`💳 Creating checkout session ${PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS} days before event...`);

          // Verify payment method exists
          if (!rule.payment_method_id) {
            throw new Error('No payment method configured for rule');
          }

          const { data: paymentMethod } = await supabase
            .from('payment_methods')
            .select('stripe_payment_method_id')
            .eq('id', rule.payment_method_id)
            .single();

          if (!paymentMethod?.stripe_payment_method_id) {
            throw new Error('Payment method not found or invalid');
          }

          // Get best gift from wishlist within budget
          let giftItem: any = null;
          if (rule.recipient_id) {
            const { data: wishlist } = await supabase
              .from('wishlists')
              .select('id')
              .eq('user_id', rule.recipient_id)
              .single();

            if (wishlist?.id) {
              const { data: items } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('wishlist_id', wishlist.id)
                .lte('price', rule.budget_limit || 9999)
                .order('price', { ascending: false })
                .limit(1);
              
              giftItem = items?.[0];
            }
          }

          if (!giftItem) {
            throw new Error('No suitable gift found within budget');
          }

          // Get recipient shipping address
          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('shipping_address')
            .eq('id', rule.recipient_id)
            .single();

          if (!recipientProfile?.shipping_address) {
            throw new Error('Recipient has no shipping address');
          }

          const giftName = giftItem.name || giftItem.title || 'Gift Item';
          console.log(`💳 Creating checkout for: ${giftName} at $${giftItem.price}`);

          // Create checkout session - order will flow through scheduled-order-processor
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
            'create-checkout-session',
            {
              body: {
                cartItems: [{
                  product_id: giftItem.product_id,
                  product_name: giftName,
                  quantity: 1,
                  price: giftItem.price,
                  image_url: giftItem.image_url,
                }],
                deliveryGroups: [{
                  recipient: {
                    name: recipientName,
                    email: rule.recipient?.email,
                    address: recipientProfile.shipping_address,
                  },
                  items: [{ product_id: giftItem.product_id, quantity: 1 }],
                }],
                scheduledDeliveryDate: rule.scheduled_date,
                isAutoGift: true,
                autoGiftRuleId: rule.id,
                giftOptions: {
                  message: rule.gift_message || `Happy ${rule.date_type.replace(/_/g, ' ')}!`,
                  isGift: true,
                  giftWrap: true,
                },
                paymentMethod: paymentMethod.stripe_payment_method_id,
                confirm: true,
                pricingBreakdown: {
                  subtotal: giftItem.price,
                  shippingCost: 0,
                  giftingFee: 0,
                  taxAmount: 0,
                  total: giftItem.price,
                },
                metadata: {
                  user_id: rule.user_id,
                  is_auto_gift: 'true',
                  auto_gift_rule_id: rule.id,
                  occasion: rule.date_type,
                  recipient_name: recipientName,
                },
              },
            }
          );

          if (checkoutError) throw checkoutError;

          console.log('✅ Checkout session created:', checkoutData?.sessionId);

          // Log the checkout event
          await supabase.from('auto_gift_event_logs').insert({
            user_id: rule.user_id,
            rule_id: rule.id,
            event_type: 'checkout_session_created',
            event_data: {
              checkout_session_id: checkoutData?.sessionId,
              amount: giftItem.price,
              gift_name: giftName,
              recipient: recipientName,
              scheduled_delivery: rule.scheduled_date,
            },
            metadata: { 
              simulated: !!body.simulatedDate,
              flow: 'unified_scheduled_order_pipeline',
            },
          });

          results.checkoutCreated.push(rule.id);
        }

      } catch (error: any) {
        console.error(`❌ Failed to process rule ${rule.id}:`, error.message);
        results.failed.push({ ruleId: rule.id, error: error.message });

        // Log failure
        await supabase.from('auto_gift_event_logs').insert({
          user_id: rule.user_id,
          rule_id: rule.id,
          event_type: 'processing_failed',
          error_message: error.message,
          event_data: {},
          metadata: { simulated: !!body.simulatedDate },
        });
      }
    }

    console.log('📊 Auto-gift orchestration complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        simulatedDate: body.simulatedDate || null,
        notified: results.notified.length,
        checkoutCreated: results.checkoutCreated.length,
        failed: results.failed.length,
        resolved: results.resolved,
        details: results,
        config: {
          notificationLeadDays: PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS,
          captureLeadDays: PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Auto-gift orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
