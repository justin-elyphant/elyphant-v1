
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🎁 Processing auto-gift events...')

    // Get upcoming events that need auto-gifting
    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .rpc('get_upcoming_auto_gift_events', { days_ahead: 7 })

    if (eventsError) {
      console.error('Error fetching upcoming events:', eventsError)
      throw eventsError
    }

    console.log(`Found ${upcomingEvents?.length || 0} events to process`)

    for (const event of upcomingEvents || []) {
      try {
        await processAutoGiftEvent(supabaseClient, event)
      } catch (error) {
        console.error(`Failed to process event ${event.event_id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedEvents: upcomingEvents?.length || 0,
        message: 'Auto-gift processing completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Auto-gift processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function processAutoGiftEvent(supabaseClient: any, event: AutoGiftEvent) {
  console.log(`🎁 Processing auto-gift for event ${event.event_id}, type: ${event.event_type}`)

  // Check for existing executions with improved logic
  let existingExecution = null;
  
  if (event.event_type === 'just_because') {
    // For just_because events, check for recent executions (prevent spam)
    const { data: recentExecutions } = await supabaseClient
      .from('automated_gift_executions')
      .select('id, status, execution_date')
      .eq('rule_id', event.rule_id)
      .gte('execution_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .in('status', ['pending', 'processing', 'completed'])
    
    if (recentExecutions && recentExecutions.length > 0) {
      console.log(`⏸️ Recent execution exists for just_because rule ${event.rule_id}, skipping`)
      return
    }
  } else {
    // For calendar events, check specific event_id
    const { data: calendarExecution } = await supabaseClient
      .from('automated_gift_executions')
      .select('id, status')
      .eq('event_id', event.event_id)
      .eq('rule_id', event.rule_id)
      .maybeSingle()

    if (calendarExecution && ['pending', 'processing', 'completed'].includes(calendarExecution.status)) {
      console.log(`⏸️ Execution already exists for event ${event.event_id} with status ${calendarExecution.status}`)
      return
    }
    existingExecution = calendarExecution
  }

  // Create new execution record
  const executionData: any = {
    rule_id: event.rule_id,
    user_id: event.user_id,
    execution_date: event.event_date,
    status: 'pending',
    ai_agent_source: {
      agent: 'unified_automation',
      data_sources: ['rule_configuration'],
      confidence_score: 0.8,
      discovery_method: event.event_type === 'just_because' ? 'scheduled_automation' : 'calendar_event'
    }
  };

  // Set event_id for calendar events (null for just_because)
  if (event.event_type !== 'just_because') {
    executionData.event_id = event.event_id;
  }

  console.log(`📝 Creating execution for ${event.event_type} event...`)
  
  const { data: execution, error: executionError } = await supabaseClient
    .from('automated_gift_executions')
    .insert(executionData)
    .select()
    .single()

  if (executionError) {
    console.error('❌ Error creating execution:', executionError)
    throw executionError
  }

  console.log(`✅ Created execution ${execution.id} for ${event.event_type} event (rule: ${event.rule_id})`)

  // Get the auto-gifting rule details
  const { data: rule, error: ruleError } = await supabaseClient
    .from('auto_gifting_rules')
    .select('*')
    .eq('id', event.rule_id)
    .single()

  if (ruleError) {
    console.error('Error fetching rule:', ruleError)
    await updateExecutionStatus(supabaseClient, execution.id, 'failed', 'Failed to fetch rule details')
    return
  }

  // Get the auto-gifting settings for this user
  const { data: settings, error: settingsError } = await supabaseClient
    .from('auto_gifting_settings')
    .select('*')
    .eq('user_id', rule.user_id)
    .single()

  if (settingsError) {
    console.error('Error fetching settings:', settingsError)
    await updateExecutionStatus(supabaseClient, execution.id, 'failed', 'Failed to fetch settings details')
    return
  }

  // Attach settings to rule for backward compatibility
  rule.auto_gifting_settings = settings

  try {
    // Select gifts using the enhanced Zinc API
    const selectedProducts = await selectGiftsForExecution(supabaseClient, rule, event)
    
    const totalAmount = selectedProducts.reduce((sum: number, product: any) => sum + (product.price || 0), 0)

    // Update execution with selected products
    await supabaseClient
      .from('automated_gift_executions')
      .update({
        selected_products: selectedProducts,
        total_amount: totalAmount,
        status: rule.auto_gifting_settings?.auto_approve_gifts ? 'processing' : 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    console.log(`✅ Updated execution ${execution.id} with ${selectedProducts.length} selected products (total: $${totalAmount})`)

    // Create auto-gift notification
    await createAutoGiftNotification(supabaseClient, execution.id, event, rule, selectedProducts, totalAmount)

    // If auto-approve is enabled, proceed with order creation
    if (rule.auto_gifting_settings?.auto_approve_gifts && selectedProducts.length > 0) {
      console.log(`🚀 Auto-approving gift execution ${execution.id}`)
      await createAutoGiftOrder(supabaseClient, execution.id, selectedProducts, rule)
    } else {
      console.log(`📧 Sending approval request for execution ${execution.id}`)
      await sendApprovalRequest(supabaseClient, execution.id, event, rule, selectedProducts, totalAmount)
    }

  } catch (error) {
    console.error(`Error processing gifts for execution ${execution.id}:`, error)
    await updateExecutionStatus(supabaseClient, execution.id, 'failed', error.message)
  }
}

async function selectGiftsForExecution(supabaseClient: any, rule: any, event: AutoGiftEvent) {
  const criteria = rule.gift_selection_criteria || {}
  const maxBudget = rule.budget_limit || 50

  console.log(`🎁 Selecting gifts for execution with hierarchical selection`)

  // STEP 1: Try wishlist selection first (highest priority)
  try {
    const wishlistProducts = await selectGiftsFromWishlist(supabaseClient, rule, maxBudget)
    if (wishlistProducts && wishlistProducts.length > 0) {
      console.log(`✅ Found ${wishlistProducts.length} gifts from recipient's wishlist`)
      return wishlistProducts
    }
  } catch (wishlistError) {
    console.log('Wishlist selection failed, continuing to next method:', wishlistError.message)
  }

  // STEP 2: Try Nicole AI enhancement
  try {
    const nicoleSelection = await selectGiftsWithNicoleAI(supabaseClient, rule, event)
    if (nicoleSelection && nicoleSelection.products.length > 0) {
      console.log(`✅ Nicole selected ${nicoleSelection.products.length} gifts with ${nicoleSelection.confidence} confidence`)
      
      // Update execution with Nicole attribution
      await supabaseClient
        .from('automated_gift_executions')
        .update({
          ai_agent_source: nicoleSelection.aiAttribution,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', event.event_id)
        .eq('rule_id', event.rule_id)
      
      return nicoleSelection.products
    }
  } catch (nicoleError) {
    console.log('Nicole selection failed, falling back to generic search:', nicoleError.message)
  }

  // STEP 3: Fallback to generic product search
  console.log('🔄 Using generic product search as final fallback')
  
  // Build search query based on event type and criteria
  let searchQuery = buildSearchQuery(criteria, event)

  console.log(`Searching for gifts with query: "${searchQuery}", budget: $${maxBudget}`)

  // Use the enhanced Zinc API via the get-products function
  const { data: searchResults, error } = await supabaseClient.functions.invoke('get-products', {
    body: {
      query: searchQuery,
      page: 1,
      limit: 20,
      filters: {
        max_price: maxBudget,
        min_price: criteria.min_price || 10
      }
    }
  })

  if (error) {
    console.error('Error searching for products:', error)
    throw new Error(`Product search failed: ${error.message || 'Unknown API error'}`)
  }

  console.log('Search results received:', { 
    hasProducts: !!searchResults?.products, 
    hasResults: !!searchResults?.results,
    productsLength: searchResults?.products?.length || 0,
    resultsLength: searchResults?.results?.length || 0
  })

  // Check both 'products' and 'results' for compatibility
  const products = searchResults?.products || searchResults?.results || []
  
  if (products.length === 0) {
    // Try fallback search
    console.log('No products found, trying fallback search')
    const fallbackQuery = buildFallbackQuery(event.event_type)
    
    const { data: fallbackResults, error: fallbackError } = await supabaseClient.functions.invoke('get-products', {
      body: {
        query: fallbackQuery,
        page: 1,
        limit: 20,
        filters: { max_price: maxBudget }
      }
    })

    if (fallbackError) {
      console.error('Fallback search error:', fallbackError)
      throw new Error(`Fallback search failed: ${fallbackError.message || 'Unknown error'}`)
    }

    const fallbackProducts = fallbackResults?.products || fallbackResults?.results || []
    if (fallbackProducts.length === 0) {
      throw new Error('No suitable products found for auto-gifting after fallback search')
    }

    console.log(`Found ${fallbackProducts.length} products from fallback search`)
    return filterAndSelectProducts(fallbackProducts, maxBudget, criteria)
  }

  console.log(`Found ${products.length} products from primary search`)
  return filterAndSelectProducts(products, maxBudget, criteria)
}

async function selectGiftsFromWishlist(supabaseClient: any, rule: any, maxBudget: number) {
  console.log(`🎯 Checking recipient's wishlist for gifts under $${maxBudget}`)
  
  // Get the recipient's wishlists (both public and private for connected users)
  const { data: wishlists, error: wishlistError } = await supabaseClient
    .from('wishlists')
    .select(`
      id,
      title,
      is_public,
      wishlist_items (
        product_id,
        title,
        price,
        image_url,
        product_source
      )
    `)
    .eq('user_id', rule.recipient_id)
    .not('wishlist_items', 'is', null)

  if (wishlistError) {
    console.error('Error fetching wishlists:', wishlistError)
    throw new Error(`Wishlist fetch failed: ${wishlistError.message}`)
  }

  if (!wishlists || wishlists.length === 0) {
    console.log('No public wishlists found for recipient')
    return []
  }

  // Flatten all wishlist items and filter by budget
  const allWishlistItems = wishlists.flatMap(wishlist => wishlist.wishlist_items || [])
  const affordableItems = allWishlistItems.filter(item => 
    item.price && item.price <= maxBudget
  )

  console.log(`Found ${allWishlistItems.length} total wishlist items, ${affordableItems.length} within budget`)

  if (affordableItems.length === 0) {
    console.log('No wishlist items found within budget')
    return []
  }

  // Convert wishlist items to the expected product format
  const wishlistProducts = affordableItems.map(item => ({
    product_id: item.product_id,
    id: item.product_id,
    title: item.title,
    name: item.title,
    price: item.price,
    image: item.image_url || '',
    product_url: item.product_url || '',
    fromWishlist: true,
    category: 'wishlist-item'
  }))

  // Apply product filtering and selection
  return filterAndSelectProducts(wishlistProducts, maxBudget, {})
}

async function selectGiftsWithNicoleAI(supabaseClient: any, rule: any, event: AutoGiftEvent) {
  try {
    console.log(`🤖 Attempting Nicole AI gift selection for recipient ${rule.recipient_id}`)
    
    // Get recipient profile with enhanced data
    const { data: recipientProfile } = await supabaseClient
      .from('profiles')
      .select('name, interests, gift_preferences, bio, age_range')
      .eq('id', rule.recipient_id)
      .single()

    if (!recipientProfile) {
      console.log('⚠️ No recipient profile found, cannot use Nicole AI')
      return null
    }

    // Build enhanced context for Nicole
    const nicoleContext = {
      recipientName: recipientProfile.name,
      interests: recipientProfile.interests || [],
      giftPreferences: recipientProfile.gift_preferences || [],
      budget: rule.budget_limit || 50,
      occasion: event.event_type,
      relationshipType: rule.relationship_context?.closeness_level || 'friend',
      bio: recipientProfile.bio,
      ageRange: recipientProfile.age_range
    }

    console.log(`🧠 Nicole context: ${JSON.stringify(nicoleContext, null, 2)}`)

    // Use enhanced gift recommendations instead of direct Nicole chat
    const { data: enhancedResponse, error } = await supabaseClient.functions.invoke('enhanced-gift-recommendations', {
      body: {
        searchContext: {
          budget: [Math.floor((rule.budget_limit || 50) * 0.7), rule.budget_limit || 50],
          occasion: event.event_type,
          relationship: rule.relationship_context?.closeness_level || 'friend',
          preferences: recipientProfile.interests || [],
          giftHistory: [],
          timeline: 'immediate'
        },
        recipientIdentifier: rule.recipient_id,
        executionId: null,
        options: {
          includeRecommendations: true,
          maxResults: 15,
          confidenceThreshold: 0.6
        }
      }
    })

    if (error) {
      console.error('❌ Enhanced recommendations error:', error)
      return null
    }

    if (!enhancedResponse?.recommendations || enhancedResponse.recommendations.length === 0) {
      console.log('⚠️ Enhanced recommendations returned no results')
      return null
    }

    console.log(`✅ Nicole found ${enhancedResponse.recommendations.length} recommendations`)

    // Format products for execution
    const selectedProducts = enhancedResponse.recommendations.slice(0, 3).map((rec: any) => ({
      product_id: rec.product?.id || rec.id,
      title: rec.product?.title || rec.title,
      price: parseFloat(rec.product?.price || rec.price || 0),
      image: rec.product?.image || rec.image,
      category: rec.product?.category || rec.category,
      retailer: rec.product?.retailer || rec.retailer || 'marketplace',
      rating: parseFloat(rec.product?.rating || rec.rating || 0),
      review_count: parseInt(rec.product?.review_count || rec.reviewCount || 0),
      selected: true,
      nicole_enhanced: true,
      confidence_score: rec.confidence || 0.75,
      ai_reasoning: rec.reasoning || `Selected by Nicole AI for ${event.event_type}`
    }))

    return {
      products: selectedProducts,
      confidence: enhancedResponse.confidence || 0.75,
      aiAttribution: {
        agent: 'nicole',
        confidence_score: enhancedResponse.confidence || 0.75,
        data_sources: ['recipient_profile', 'enhanced_recommendations', 'contextual_ai'],
        discovery_method: 'nicole_enhanced_selection',
        reasoning: `Nicole AI selected ${selectedProducts.length} gifts based on recipient interests and preferences`
      }
    }

  } catch (error) {
    console.error('❌ Error in Nicole AI gift selection:', error)
    return null
  }
}

function filterAndSelectProductsWithNicole(products: any[], maxBudget: number, nicoleResponse: any): any[] {
  console.log(`🤖 Nicole filtering ${products.length} products with budget ${maxBudget}`)
  
  // Filter by budget and basic criteria
  let filteredProducts = products.filter(product => {
    const price = parseFloat(product.price) || 0
    return price > 0 && price <= maxBudget
  })
  
  // Sort by Nicole's criteria + ratings
  filteredProducts.sort((a: any, b: any) => {
    const aRating = parseFloat(a.stars) || 0
    const bRating = parseFloat(b.stars) || 0
    const aReviews = parseInt(a.num_reviews) || 0
    const bReviews = parseInt(b.num_reviews) || 0
    
    // Nicole confidence boost
    const nicoleConfidence = nicoleResponse.metadata?.confidence || 0.5
    const aScore = (aRating * 20) + (aReviews / 100) + (nicoleConfidence * 30)
    const bScore = (bRating * 20) + (bReviews / 100) + (nicoleConfidence * 30)
    
    return bScore - aScore
  })
  
  console.log(`🤖 Nicole selected ${Math.min(3, filteredProducts.length)} top products`)
  
  // Return top 3 products with Nicole attribution
  return filteredProducts.slice(0, 3).map(product => ({
    product_id: product.product_id,
    title: product.title,
    price: parseFloat(product.price),
    image: product.image,
    category: product.category,
    retailer: product.retailer,
    rating: parseFloat(product.stars) || 0,
    review_count: parseInt(product.num_reviews) || 0,
    selected: true,
    nicole_enhanced: true,
    ai_reasoning: `Selected by Nicole AI: ${nicoleResponse.message?.substring(0, 100)}...`
  }))
}

function buildSearchQuery(criteria: any, event: AutoGiftEvent): string {
  const eventType = event.event_type?.toLowerCase() || ''
  const categories = criteria.categories || []
  
  let query = ''
  
  if (eventType.includes('birthday')) {
    query = 'birthday gift'
  } else if (eventType.includes('anniversary')) {
    query = 'anniversary gift'
  } else if (eventType.includes('wedding')) {
    query = 'wedding gift'
  } else if (eventType.includes('graduation')) {
    query = 'graduation gift'
  } else {
    query = 'gift'
  }
  
  if (categories.length > 0) {
    const categoryString = categories.join(' ')
    query = `${categoryString} ${query}`
  }
  
  return query
}

function buildFallbackQuery(eventType: string): string {
  const eventLower = eventType?.toLowerCase() || ''
  
  if (eventLower.includes('birthday')) return 'birthday gift popular'
  if (eventLower.includes('anniversary')) return 'anniversary gift ideas'
  if (eventLower.includes('wedding')) return 'wedding gift popular'
  if (eventLower.includes('graduation')) return 'graduation gift ideas'
  
  return 'popular gift ideas'
}

function filterAndSelectProducts(products: any[], maxBudget: number, criteria: any): any[] {
  console.log(`Filtering ${products.length} products with budget ${maxBudget}`)
  
  // Filter by budget and criteria
  let filteredProducts = products.filter(product => {
    const price = parseFloat(product.price) || 0
    if (price <= 0 || price > maxBudget) return false
    
    if (criteria.min_price && price < criteria.min_price) return false
    
    if (criteria.exclude_items && criteria.exclude_items.length > 0) {
      const title = product.title?.toLowerCase() || ''
      if (criteria.exclude_items.some((excluded: string) => title.includes(excluded.toLowerCase()))) {
        return false
      }
    }
    
    return true
  })
  
  // Sort by rating and review count
  filteredProducts.sort((a: any, b: any) => {
    const aRating = parseFloat(a.stars) || 0
    const bRating = parseFloat(b.stars) || 0
    const aReviews = parseInt(a.num_reviews) || 0
    const bReviews = parseInt(b.num_reviews) || 0
    
    if (aRating !== bRating) return bRating - aRating
    return bReviews - aReviews
  })
  
  console.log(`Found ${filteredProducts.length} suitable products`)
  
  // Return top 3 products for selection
  return filteredProducts.slice(0, 3).map(product => ({
    product_id: product.product_id,
    title: product.title,
    price: parseFloat(product.price),
    image: product.image,
    category: product.category,
    retailer: product.retailer,
    rating: parseFloat(product.stars) || 0,
    review_count: parseInt(product.num_reviews) || 0,
    selected: true // Auto-select for processing
  }))
}

async function createAutoGiftOrder(supabaseClient: any, executionId: string, products: any[], rule: any) {
  console.log(`🛒 Creating auto-gift order for execution ${executionId}`)
  
  try {
    // Update execution status to processing
    await updateExecutionStatus(supabaseClient, executionId, 'processing', 'Auto-approved order creation initiated')
    
    // Get recipient shipping address
    const { data: recipientProfile } = await supabaseClient
      .from('profiles')
      .select('shipping_address, email, name')
      .eq('id', rule.recipient_id)
      .single()

    if (!recipientProfile?.shipping_address) {
      throw new Error('Recipient shipping address not available')
    }

    // Create order record for tracking
    const totalAmount = products.reduce((sum: number, product: any) => sum + (product.price || 0), 0)
    
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: rule.user_id,
        status: 'processing',
        payment_status: 'succeeded', // Auto-approved orders use saved payment method
        total_amount: totalAmount,
        shipping_address: recipientProfile.shipping_address,
        is_gift: true,
        gift_message: rule.gift_message || 'A thoughtful gift selected just for you!',
        recipient_email: recipientProfile.email,
        recipient_name: recipientProfile.name,
        order_items: products.map(product => ({
          product_id: product.product_id,
          quantity: 1,
          price: product.price,
          title: product.title,
          image: product.image
        })),
        execution_id: executionId
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`)
    }

    // Update execution with order ID
    await supabaseClient
      .from('automated_gift_executions')
      .update({
        order_id: order.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)

    console.log(`✅ Auto-gift order ${order.id} created successfully for execution ${executionId}`)
    
    // Send completion notification
    await createAutoGiftNotification(supabaseClient, executionId, null, rule, products, totalAmount, 'order_created')

  } catch (error) {
    console.error(`❌ Auto-gift order creation failed for execution ${executionId}:`, error)
    await updateExecutionStatus(supabaseClient, executionId, 'failed', `Order creation failed: ${error.message}`)
  }
}

async function createAutoGiftNotification(supabaseClient: any, executionId: string, event: AutoGiftEvent | null, rule: any, products: any[], totalAmount: number, type: string = 'execution_created') {
  console.log(`📢 Creating auto-gift notification for execution ${executionId}, type: ${type}`)
  
  try {
    let title = '';
    let message = '';
    
    switch (type) {
      case 'execution_created':
        title = '🎁 Auto-Gift Selected';
        message = `We found ${products.length} perfect gift${products.length > 1 ? 's' : ''} for ${event?.event_type} (Total: $${totalAmount}). ${rule.auto_gifting_settings?.auto_approve_gifts ? 'Order will be placed automatically.' : 'Approval required.'}`;
        break;
      case 'order_created':
        title = '✅ Auto-Gift Order Placed';
        message = `Your auto-gift order has been placed successfully! Total: $${totalAmount}. The recipient will receive their gift soon.`;
        break;
      case 'approval_needed':
        title = '👀 Auto-Gift Approval Needed';
        message = `Please review and approve the selected gifts for ${event?.event_type} (Total: $${totalAmount}). Check your email for details.`;
        break;
    }

    await supabaseClient
      .from('auto_gift_notifications')
      .insert({
        user_id: rule.user_id,
        execution_id: executionId,
        notification_type: type,
        title,
        message,
        email_sent: false,
        is_read: false
      });

    console.log(`✅ Auto-gift notification created for execution ${executionId}`);
  } catch (error) {
    console.error(`❌ Failed to create notification for execution ${executionId}:`, error);
  }
}

async function sendApprovalRequest(supabaseClient: any, executionId: string, event: AutoGiftEvent, rule: any, products: any[], totalAmount: number) {
  console.log(`📧 Sending approval request for execution ${executionId}`)
  
  try {
    // Generate approval token
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now

    const { data: approvalToken, error: tokenError } = await supabaseClient
      .from('email_approval_tokens')
      .insert({
        user_id: rule.user_id,
        execution_id: executionId,
        token,
        expires_at: expiresAt.toISOString(),
        email_sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (tokenError) {
      throw new Error(`Failed to create approval token: ${tokenError.message}`);
    }

    // Get user profile for email
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('email, name')
      .eq('id', rule.user_id)
      .single();

    if (!userProfile?.email) {
      throw new Error('User email not found for approval request');
    }

    // Queue approval email
    const emailTemplate = {
      recipient_email: userProfile.email,
      recipient_name: userProfile.name || 'Gift Giver',
      template_type: 'auto_gift_approval',
      template_variables: {
        user_name: userProfile.name || 'Gift Giver',
        event_type: event.event_type,
        recipient_name: 'Recipient', // Could be enhanced with actual recipient name
        total_amount: totalAmount,
        product_count: products.length,
        products: products.map(p => ({
          title: p.title,
          price: p.price,
          image: p.image
        })),
        approval_url: `${Deno.env.get('SITE_URL')}/auto-gifts/approve/${token}`,
        expires_at: expiresAt.toISOString()
      }
    };

    await supabaseClient
      .from('email_queue')
      .insert({
        ...emailTemplate,
        scheduled_for: new Date().toISOString()
      });

    // Create approval needed notification
    await createAutoGiftNotification(supabaseClient, executionId, event, rule, products, totalAmount, 'approval_needed');

    console.log(`✅ Approval request sent for execution ${executionId}, token: ${token}`);
    
  } catch (error) {
    console.error(`❌ Failed to send approval request for execution ${executionId}:`, error);
    await updateExecutionStatus(supabaseClient, executionId, 'failed', `Approval request failed: ${error.message}`);
  }
}

async function updateExecutionStatus(supabaseClient: any, executionId: string, status: string, errorMessage?: string) {
  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  if (errorMessage) {
    updates.error_message = errorMessage
  }
  
  await supabaseClient
    .from('automated_gift_executions')
    .update(updates)
    .eq('id', executionId)
}
