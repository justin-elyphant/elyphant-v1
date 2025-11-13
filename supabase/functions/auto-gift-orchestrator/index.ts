import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎁 Running auto-gift orchestrator...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Find auto-gifting rules with upcoming events (7 days or less)
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
      processed: [] as string[],
      failed: [] as { ruleId: string; error: string }[],
    };

    for (const rule of upcomingRules || []) {
      try {
        console.log(`🎁 Processing auto-gift rule: ${rule.id}`);

        const eventDate = new Date(rule.next_trigger_date);
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // If 7 days before, send notification (approval required)
        if (daysUntil === 7) {
          console.log('📬 Sending 7-day notification...');
          
          // Create notification
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

        // If event is today or approval was given, process the gift
        if (daysUntil <= 0 || rule.approval_status === 'approved') {
          console.log('🚀 Processing auto-gift payment...');

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

          // Create payment intent with saved payment method
          const { data: paymentIntentData, error: paymentError } = await supabase.functions.invoke(
            'create-payment-intent-v2',
            {
              body: {
                amount: gift.products.price,
                cartItems: [{
                  product_id: gift.product_id,
                  product_name: gift.products.name,
                  quantity: 1,
                  price: gift.products.price,
                  image_url: gift.products.image,
                }],
                shippingAddress: connection?.shipping_address,
                scheduledDeliveryDate: rule.next_trigger_date,
                isAutoGift: true,
                autoGiftRuleId: rule.id,
                giftOptions: {
                  message: rule.gift_message || `Happy ${rule.occasion_type}!`,
                  wrap: true,
                },
                paymentMethodId: paymentMethod.stripe_payment_method_id,
              },
            }
          );

          if (paymentError) {
            throw paymentError;
          }

          // Update rule
          await supabase
            .from('auto_gifting_rules')
            .update({
              last_executed_at: new Date().toISOString(),
              execution_count: (rule.execution_count || 0) + 1,
              approval_status: null, // Reset for next time
            })
            .eq('id', rule.id);

          results.processed.push(rule.id);
          console.log(`✅ Auto-gift processed for rule ${rule.id}`);
        }

      } catch (error: any) {
        console.error(`❌ Failed to process auto-gift rule ${rule.id}:`, error);
        results.failed.push({
          ruleId: rule.id,
          error: error.message,
        });

        // Send failure notification
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
        processed: results.processed.length,
        failed: results.failed.length,
        details: results,
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
