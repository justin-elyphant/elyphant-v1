// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json()
    const { eventId } = body;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the event details
    const { data: event, error: eventError } = await supabaseClient
      .from('automated_gift_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process the event
    await processAutoGiftEvent(supabaseClient, event);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto-gift event processed successfully',
        eventId: eventId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Auto-gift processor error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function processAutoGiftEvent(supabaseClient, event) {
  console.log(`Processing auto-gift event ${event.id} for user ${event.user_id}`);

  // Create execution record
  const executionId = crypto.randomUUID();
  
  const { error: executionError } = await supabaseClient
    .from('automated_gift_executions')
    .insert({
      id: executionId,
      user_id: event.user_id,
      rule_id: event.rule_id,
      event_id: event.id,
      status: 'processing'
    });

  if (executionError) {
    console.error('Failed to create execution record:', executionError);
    return;
  }

  try {
    // Get the auto-gifting rule
    const { data: rule, error: ruleError } = await supabaseClient
      .from('auto_gifting_rules')
      .select('*')
      .eq('id', event.rule_id)
      .single();

    if (ruleError || !rule) {
      await updateExecutionStatus(supabaseClient, executionId, 'failed', 'Auto-gifting rule not found');
      return;
    }

    // Get gift recommendations based on the rule
    const recommendations = await getGiftRecommendations(supabaseClient, rule);

    if (!recommendations || recommendations.length === 0) {
      await updateExecutionStatus(supabaseClient, executionId, 'failed', 'No suitable gifts found');
      return;
    }

    // Update execution with selected products
    await supabaseClient
      .from('automated_gift_executions')
      .update({
        selected_products: recommendations,
        status: 'pending_approval',
        total_amount: recommendations.reduce((sum, item) => sum + (item.price || 0), 0)
      })
      .eq('id', executionId);

    console.log(`Auto-gift execution ${executionId} created with ${recommendations.length} product recommendations`);

  } catch (error) {
    await updateExecutionStatus(supabaseClient, executionId, 'failed', `Processing error: ${error?.message || 'Unknown error'}`);
  }
}

async function getGiftRecommendations(supabaseClient, rule) {
  console.log('Getting gift recommendations for rule:', rule.id);

  try {
    const criteria = {
      budget_limit: rule.budget_limit,
      max_price: rule.budget_limit,
      min_price: 10, // Minimum $10 for gifts
      categories: rule.gift_preferences?.categories || [],
      recipient_id: rule.recipient_id
    };

    // First try to get items from recipient's wishlist
    const { data: wishlistItems, error: wishlistError } = await supabaseClient
      .from('wishlist_items')
      .select(`
        *,
        wishlists!inner(user_id, is_public)
      `)
      .eq('wishlists.user_id', rule.recipient_id)
      .eq('wishlists.is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!wishlistError && wishlistItems && wishlistItems.length > 0) {
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
        image: item.image_url,
        vendor: 'amazon',
        source: 'wishlist'
      }));
    }

    // Fallback to general gift recommendations
    return await getGeneralGiftRecommendations(criteria);

  } catch (error) {
    console.error('Error getting gift recommendations:', error);
    return [];
  }
}

async function getGeneralGiftRecommendations(criteria) {
  // For now, return some sample recommendations
  // In a real implementation, this would call external APIs or recommendation engines
  
  const sampleGifts = [
    {
      product_id: 'B08N5WRWNW',
      name: 'Echo Dot (4th Gen) Smart speaker with Alexa',
      price: 49.99,
      image: 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg',
      vendor: 'amazon',
      source: 'recommendation'
    },
    {
      product_id: 'B07FZ8S74R',
      name: 'Instant Vortex Plus 4 Quart Air Fryer',
      price: 79.99,
      image: 'https://m.media-amazon.com/images/I/71lNrnzWalL._AC_SL1500_.jpg',
      vendor: 'amazon',
      source: 'recommendation'
    }
  ];

  // Filter by budget
  return sampleGifts.filter(gift => 
    gift.price <= criteria.budget_limit && 
    gift.price >= (criteria.min_price || 0)
  ).slice(0, 1);
}

async function createAutomatedOrder(supabaseClient, execution, selectedProducts, rule) {
  try {
    // Get recipient shipping info
    const { data: recipientProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', rule.recipient_id)
      .single();

    if (profileError || !recipientProfile) {
      throw new Error('Recipient profile not found');
    }

    // Calculate order total
    const orderTotal = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);

    // Create order
    const { data: newOrder, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: execution.user_id,
        total_amount: orderTotal,
        status: 'pending',
        is_gift: true,
        gift_message: rule.gift_message || 'Hope you enjoy this gift!',
        recipient_id: rule.recipient_id,
        auto_gift_execution_id: execution.id
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Create order items
    const orderItems = selectedProducts.map(product => ({
      order_id: newOrder.id,
      product_id: product.product_id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      total_price: product.price
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log(`Automated order created successfully for event ${event.event_id}`);

  } catch (error) {
    await updateExecutionStatus(supabaseClient, executionId, 'failed', `Order processing error: ${(error as any)?.message || 'Unknown error'}`);
  }
}

async function updateExecutionStatus(
  supabaseClient,
  executionId,
  status,
  errorMessage = null
) {
  const updateData = {
    status: status,
    updated_at: new Date().toISOString()
  };

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabaseClient
    .from('automated_gift_executions')
    .update(updateData)
    .eq('id', executionId);

  if (error) {
    console.error('Failed to update execution status:', error);
  }
}