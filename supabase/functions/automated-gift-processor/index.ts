
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoGiftEvent {
  event_id: string;
  rule_id: string;
  user_id: string;
  event_date: string;
  event_type: string;
  recipient_id: string;
  budget_limit: number;
  notification_days: number[];
}

interface GiftSelectionCriteria {
  source: "wishlist" | "ai" | "both" | "specific";
  max_price?: number;
  min_price?: number;
  categories: string[];
  exclude_items: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting automated gift processing...');

    // Get upcoming auto-gift events
    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .rpc('get_upcoming_auto_gift_events', { days_ahead: 1 });

    if (eventsError) {
      console.error('Error fetching upcoming events:', eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} upcoming auto-gift events`);

    for (const event of upcomingEvents || []) {
      await processAutoGiftEvent(supabaseClient, event);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: upcomingEvents?.length || 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Auto-gift processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function processAutoGiftEvent(
  supabaseClient: any, 
  event: AutoGiftEvent
) {
  console.log(`Processing auto-gift for event ${event.event_id}`);

  try {
    // Create execution record
    const { data: execution, error: executionError } = await supabaseClient
      .from('automated_gift_executions')
      .insert({
        rule_id: event.rule_id,
        event_id: event.event_id,
        user_id: event.user_id,
        execution_date: event.event_date,
        status: 'processing'
      })
      .select()
      .single();

    if (executionError) {
      console.error('Error creating execution record:', executionError);
      return;
    }

    // Get the auto-gifting rule details
    const { data: rule, error: ruleError } = await supabaseClient
      .from('auto_gifting_rules')
      .select('*')
      .eq('id', event.rule_id)
      .single();

    if (ruleError || !rule) {
      await updateExecutionStatus(supabaseClient, execution.id, 'failed', 'Rule not found');
      return;
    }

    // Select gifts based on criteria
    const selectedProducts = await selectGiftsForEvent(supabaseClient, event, rule);

    if (!selectedProducts || selectedProducts.length === 0) {
      await updateExecutionStatus(supabaseClient, execution.id, 'failed', 'No suitable products found');
      return;
    }

    // Calculate total amount
    const totalAmount = selectedProducts.reduce((sum, product) => sum + product.price, 0);

    if (rule.budget_limit && totalAmount > rule.budget_limit) {
      await updateExecutionStatus(supabaseClient, execution.id, 'failed', `Total amount $${totalAmount} exceeds budget limit $${rule.budget_limit}`);
      return;
    }

    // If auto-approve is enabled, create the order
    if (rule.auto_approve_gifts) {
      await createAutomatedOrder(supabaseClient, event, rule, selectedProducts, execution.id);
    } else {
      // Update execution with selected products for user approval
      await supabaseClient
        .from('automated_gift_executions')
        .update({
          status: 'pending',
          selected_products: selectedProducts,
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id);

      // Send notification to user for approval
      await sendApprovalNotification(supabaseClient, event, selectedProducts, totalAmount);
    }

  } catch (error) {
    console.error(`Error processing auto-gift event ${event.event_id}:`, error);
  }
}

async function selectGiftsForEvent(
  supabaseClient: any,
  event: AutoGiftEvent,
  rule: any
): Promise<any[]> {
  const criteria: GiftSelectionCriteria = rule.gift_selection_criteria || { source: 'wishlist', categories: [], exclude_items: [] };

  // For now, implement wishlist-based selection
  if (criteria.source === 'wishlist' || criteria.source === 'both') {
    const { data: wishlistItems } = await supabaseClient
      .from('wishlist_items')
      .select(`
        *,
        wishlists!inner(user_id)
      `)
      .eq('wishlists.user_id', event.recipient_id)
      .limit(3);

    if (wishlistItems && wishlistItems.length > 0) {
      // Filter by price range if specified
      let filteredItems = wishlistItems;
      
      if (criteria.max_price) {
        filteredItems = filteredItems.filter(item => item.price <= criteria.max_price);
      }
      
      if (criteria.min_price) {
        filteredItems = filteredItems.filter(item => item.price >= criteria.min_price);
      }

      // Return top item(s) within budget
      return filteredItems.slice(0, 1).map(item => ({
        product_id: item.product_id,
        name: item.name || item.title,
        price: item.price,
        image_url: item.image_url,
        source: 'wishlist'
      }));
    }
  }

  // Fallback: return empty array (could implement AI selection or specific product selection here)
  return [];
}

async function createAutomatedOrder(
  supabaseClient: any,
  event: AutoGiftEvent,
  rule: any,
  selectedProducts: any[],
  executionId: string
) {
  try {
    // Get user's default shipping address
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('shipping_address')
      .eq('id', event.user_id)
      .single();

    const shippingAddress = userProfile?.shipping_address || {};

    // Create order
    const totalAmount = selectedProducts.reduce((sum, product) => sum + product.price, 0);
    
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: event.user_id,
        subtotal: totalAmount,
        total_amount: totalAmount,
        shipping_info: shippingAddress,
        status: 'automated_pending',
        gift_options: {
          isGift: true,
          giftMessage: rule.gift_message || `Happy ${event.event_type}!`,
          isAutomated: true
        }
      })
      .select()
      .single();

    if (orderError) {
      await updateExecutionStatus(supabaseClient, executionId, 'failed', `Order creation failed: ${orderError.message}`);
      return;
    }

    // Create order items
    for (const product of selectedProducts) {
      await supabaseClient
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.product_id,
          product_name: product.name,
          unit_price: product.price,
          total_price: product.price,
          quantity: 1,
          product_image: product.image_url
        });
    }

    // Update execution status
    await supabaseClient
      .from('automated_gift_executions')
      .update({
        status: 'completed',
        selected_products: selectedProducts,
        total_amount: totalAmount,
        order_id: order.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    console.log(`Automated order created successfully for event ${event.event_id}`);

  } catch (error) {
    await updateExecutionStatus(supabaseClient, executionId, 'failed', `Order processing error: ${error.message}`);
  }
}

async function updateExecutionStatus(
  supabaseClient: any,
  executionId: string,
  status: string,
  errorMessage?: string
) {
  await supabaseClient
    .from('automated_gift_executions')
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId);
}

async function sendApprovalNotification(
  supabaseClient: any,
  event: AutoGiftEvent,
  selectedProducts: any[],
  totalAmount: number
) {
  // TODO: Implement notification system (email/in-app)
  console.log(`Approval needed for auto-gift: Event ${event.event_type}, Total: $${totalAmount}`);
}
