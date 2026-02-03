import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { 
  PAYMENT_LEAD_TIME_CONFIG, 
  getDaysUntil 
} from '../shared/paymentLeadTime.ts';
import { 
  calculateHolidayDate, 
  calculateNextBirthday 
} from '../shared/holidayDates.ts';

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

    // Helper: Wrap shared calculateNextBirthday to use reference date
    const getNextBirthday = (dob: string | null): string | null => {
      if (!dob) return null;
      return calculateNextBirthday(dob, simulatedDate);
    };

    // Helper: Wrap shared calculateHolidayDate to use reference date
    const getNextHolidayDate = (holidayKey: string): string | null => {
      return calculateHolidayDate(holidayKey, simulatedDate);
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
    // Include interests for 4-tier gift selection fallback
    const { data: unscheduledRules } = await supabase
      .from('auto_gifting_rules')
      .select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(id, name, email, dob, interests)')
      .eq('is_active', true)
      .is('scheduled_date', null);

    const resolvedRules: any[] = [];
    for (const rule of unscheduledRules || []) {
      let resolvedDate: string | null = null;
      
      if (rule.date_type === 'birthday' && rule.recipient?.dob) {
        resolvedDate = getNextBirthday(rule.recipient.dob);
      } else if (['christmas', 'valentine', 'mothers_day', 'fathers_day'].includes(rule.date_type)) {
        resolvedDate = getNextHolidayDate(rule.date_type);
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
              // First get purchased item IDs to exclude
              const { data: purchasedItems } = await supabase
                .from('wishlist_item_purchases')
                .select('item_id')
                .eq('wishlist_id', wishlist.id);

              const purchasedItemIds = (purchasedItems || []).map(p => p.item_id);
              
              if (purchasedItemIds.length > 0) {
                console.log(`🔍 Excluding ${purchasedItemIds.length} already-purchased item(s) from wishlist`);
              }

              // Query wishlist items excluding purchased ones
              let itemsQuery = supabase
                .from('wishlist_items')
                .select('id, product_id, name, title, price, image_url')
                .eq('wishlist_id', wishlist.id)
                .lte('price', rule.budget_limit || 9999)
                .order('price', { ascending: false })
                .limit(3);

              // Exclude purchased items if any exist
              if (purchasedItemIds.length > 0) {
                itemsQuery = itemsQuery.not('id', 'in', `(${purchasedItemIds.join(',')})`);
              }

              const { data: wishlistItems } = await itemsQuery;

              if (!wishlistItems?.length && purchasedItemIds.length > 0) {
                console.log('📋 No unpurchased wishlist items available, will try fallback search');
              }

              suggestedProducts = (wishlistItems || []).map(item => ({
                product_id: item.product_id,
                name: item.name || item.title || 'Gift Item',
                price: item.price,
                image_url: item.image_url,
                wishlist_id: wishlist.id,         // For "Purchased" badge tracking
                wishlist_item_id: item.id,        // For wishlist_item_purchases insert
              }));
            }
          }

          // Tier 3 Fallback: If no wishlist items, try recipient profile interests
          if (suggestedProducts.length === 0 && rule.recipient_id) {
            const recipientInterests = rule.recipient?.interests as string[] | null;
            if (recipientInterests?.length) {
              console.log(`🎯 Using recipient interests for search: ${recipientInterests.slice(0, 3).join(', ')}`);
              
              const { data: searchResult, error: searchError } = await supabase.functions.invoke('get-products', {
                body: {
                  query: recipientInterests[0],
                  limit: 5,
                  filters: { maxPrice: rule.budget_limit || 100 }
                }
              });
              
              if (!searchError) {
                const products = searchResult?.results || searchResult?.products || [];
                suggestedProducts = products.slice(0, 3).map((p: any) => ({
                  product_id: p.product_id || p.asin,
                  name: p.title,
                  price: p.price,
                  image_url: p.image || p.main_image,
                }));
                console.log(`✅ Found ${suggestedProducts.length} products via interests search`);
              } else {
                console.warn('⚠️ Interests-based search failed:', searchError);
              }
            }
          }

          console.log(`🎁 Found ${suggestedProducts.length} suggested products within $${rule.budget_limit} budget`);

          // Create execution record for approval tracking
          const { data: execution, error: execError } = await supabase
            .from('automated_gift_executions')
            .insert({
              rule_id: rule.id,
              user_id: rule.user_id,
              execution_date: rule.scheduled_date,
              status: 'pending_approval',
              selected_products: suggestedProducts,
              total_amount: suggestedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
            })
            .select('id')
            .single();

          if (execError) {
            console.error('❌ Failed to create execution record:', execError.message);
            throw new Error(`Failed to create execution record: ${execError.message}`);
          }
          console.log(`✅ Created execution record: ${execution.id}`);

          // Generate secure approval token (same pattern as gift preview tokens)
          const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
          const expiresAt = new Date(simulatedDate);
          expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

          const { error: tokenError } = await supabase
            .from('email_approval_tokens')
            .insert({
              execution_id: execution.id,
              user_id: rule.user_id,
              token: token,
              expires_at: expiresAt.toISOString(),
            });

          if (tokenError) {
            console.error('❌ Failed to create approval token:', tokenError.message);
            throw new Error(`Failed to create approval token: ${tokenError.message}`);
          }
          console.log(`✅ Generated approval token: ${token.substring(0, 10)}...`);

          // Build approval URLs
          const baseUrl = 'https://elyphant.ai';
          const approve_url = `${baseUrl}/auto-gifts/approve/${token}`;
          const reject_url = `${baseUrl}/auto-gifts/approve/${token}?action=reject`;

          // Trigger notification email with approval URLs
          const { data: userData } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', rule.user_id)
            .single();

          if (userData?.email) {
            // Calculate deadline date (T-5: 2 days before capture at T-4)
            const deadlineDate = new Date(eventDate);
            deadlineDate.setDate(deadlineDate.getDate() - 5);
            const deadlineDateFormatted = deadlineDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            });
            
            // Format event date for display
            const eventDateFormatted = eventDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            });

            await supabase.functions.invoke('ecommerce-email-orchestrator', {
              body: {
                eventType: 'auto_gift_approval',
                recipientEmail: userData.email,
                data: {
                  first_name: userData.name?.split(' ')[0] || 'there',
                  recipient_name: recipientName,
                  occasion: rule.date_type,
                  event_date: eventDateFormatted,
                  deadline_date: deadlineDateFormatted,
                  suggested_gifts: suggestedProducts.slice(0, 3),
                  budget: rule.budget_limit,
                  rule_id: rule.id,
                  execution_id: execution.id,
                  approve_url,
                  reject_url,
                }
              }
            });
            console.log(`📧 Notification email sent to ${userData.email} with approval links`);
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
              // First get purchased item IDs to exclude
              const { data: purchasedItems } = await supabase
                .from('wishlist_item_purchases')
                .select('item_id')
                .eq('wishlist_id', wishlist.id);

              const purchasedItemIds = (purchasedItems || []).map(p => p.item_id);
              
              if (purchasedItemIds.length > 0) {
                console.log(`🔍 Excluding ${purchasedItemIds.length} already-purchased item(s) from wishlist`);
              }

              // Query unpurchased wishlist items
              let itemsQuery = supabase
                .from('wishlist_items')
                .select('*')
                .eq('wishlist_id', wishlist.id)
                .lte('price', rule.budget_limit || 9999)
                .order('price', { ascending: false })
                .limit(1);

              if (purchasedItemIds.length > 0) {
                itemsQuery = itemsQuery.not('id', 'in', `(${purchasedItemIds.join(',')})`);
              }

              const { data: items } = await itemsQuery;

              if (!items?.length && purchasedItemIds.length > 0) {
                console.log('📋 No unpurchased wishlist items available, will try fallback search');
              }
              
              if (items?.[0]) {
                giftItem = {
                  ...items[0],
                  wishlist_id: wishlist.id,         // Capture for "Purchased" badge tracking
                  wishlist_item_id: items[0].id,    // Capture for wishlist_item_purchases
                };
                console.log(`✅ Found wishlist item: ${giftItem.name || giftItem.title} with tracking IDs`);
              }
            }
          }

          // Fallback: If no wishlist item, use 4-tier search hierarchy
          if (!giftItem) {
            console.log('🔍 No wishlist item found, falling back to tiered search');
            
            const criteria = rule.gift_selection_criteria as any;
            const recipientInterests = rule.recipient?.interests as string[] | null;
            
            // 4-tier search query: rule criteria → recipient interests → generic
            const searchQuery = criteria?.preferred_brands?.[0] 
              || criteria?.categories?.[0] 
              || recipientInterests?.[0]  // NEW: Tier 3 - Use recipient's profile interests
              || 'gift';

            const searchSource = criteria?.preferred_brands?.[0] ? 'rule.preferred_brands' :
              criteria?.categories?.[0] ? 'rule.categories' :
              recipientInterests?.[0] ? 'recipient.interests' :
              'generic fallback';
            console.log(`🔍 Search query: "${searchQuery}" (source: ${searchSource})`);
            
            const { data: searchResult, error: searchError } = await supabase.functions.invoke('get-products', {
              body: {
                query: searchQuery,
                limit: 5,
                filters: {
                  maxPrice: rule.budget_limit || 100
                }
              }
            });
            
            if (!searchError) {
              const products = searchResult?.results || searchResult?.products || [];
              if (products.length > 0) {
                // Pick random from top 5 for variety
                const randomIndex = Math.floor(Math.random() * Math.min(5, products.length));
                const product = products[randomIndex];
                giftItem = {
                  product_id: product.product_id || product.asin,
                  name: product.title,
                  price: product.price,
                  image_url: product.image || product.main_image
                };
                console.log(`✅ Found product via search: ${giftItem.name} at $${giftItem.price}`);
              }
            } else {
              console.warn('⚠️ get-products search failed:', searchError);
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
                  wishlist_id: giftItem.wishlist_id || null,          // Pass for badge tracking
                  wishlist_item_id: giftItem.wishlist_item_id || null, // Pass for badge tracking
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
