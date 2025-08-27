
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getEmergencyFallbackProducts, logExecutionError } from './emergency-fallback.ts'

// Recovery functionality for stuck executions
async function recoverStuckExecutions(supabaseClient: any) {
  console.log('🔧 Checking for stuck executions...')
  
  try {
    // Find executions that have been in "processing" status for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: stuckExecutions, error } = await supabaseClient
      .from('automated_gift_executions')
      .select('id, user_id, rule_id, status, created_at, updated_at, retry_count')
      .eq('status', 'processing')
      .lt('updated_at', thirtyMinutesAgo)

    if (error) {
      console.error('❌ Error querying stuck executions:', error)
      return
    }

    if (!stuckExecutions || stuckExecutions.length === 0) {
      console.log('✅ No stuck executions found')
      return
    }

    console.log(`🔧 Found ${stuckExecutions.length} stuck execution(s)`)

    for (const execution of stuckExecutions) {
      try {
        await recoverSingleExecution(supabaseClient, execution)
      } catch (error) {
        console.error(`❌ Failed to recover execution ${execution.id}:`, error)
      }
    }

  } catch (error) {
    console.error('❌ Error in stuck execution recovery:', error)
  }
}

async function recoverSingleExecution(supabaseClient: any, execution: any) {
  console.log(`🔧 Recovering stuck execution ${execution.id}`)
  
  const maxRetries = 3
  const shouldRetry = (execution.retry_count || 0) < maxRetries
  
  if (shouldRetry) {
    // Reset to pending for retry with exponential backoff
    const retryDelay = Math.pow(2, execution.retry_count || 0) * 5 // 5, 10, 20 minutes
    const nextRetryAt = new Date(Date.now() + retryDelay * 60 * 1000).toISOString()
    
    console.log(`🔄 Scheduling retry ${(execution.retry_count || 0) + 1}/${maxRetries} for execution ${execution.id}`)
    
    const { error: updateError } = await supabaseClient
      .from('automated_gift_executions')
      .update({
        status: 'pending',
        retry_count: (execution.retry_count || 0) + 1,
        next_retry_at: nextRetryAt,
        error_message: 'Recovered from stuck processing state',
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    if (updateError) {
      console.error(`❌ Failed to update execution ${execution.id}:`, updateError)
    } else {
      console.log(`✅ Execution ${execution.id} scheduled for retry`)
    }
  } else {
    // Mark as failed after max retries
    console.log(`❌ Marking execution ${execution.id} as failed after ${maxRetries} retries`)
    
    const { error: failError } = await supabaseClient
      .from('automated_gift_executions')
      .update({
        status: 'failed',
        error_message: `Processing stuck and exceeded ${maxRetries} retry attempts`,
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    if (failError) {
      console.error(`❌ Failed to mark execution ${execution.id} as failed:`, failError)
    } else {
      console.log(`✅ Execution ${execution.id} marked as failed`)
    }
  }

  // Log the recovery action
  try {
    await supabaseClient
      .from('auto_gift_notifications')
      .insert({
        user_id: execution.user_id,
        execution_id: execution.id,
        notification_type: 'execution_recovery',
        title: 'Auto-Gift Execution Recovered',
        message: shouldRetry 
          ? `Your auto-gift execution was stuck and has been scheduled for retry`
          : `Your auto-gift execution failed after multiple retry attempts`,
        email_sent: false,
        is_read: false
      })
  } catch (notificationError) {
    console.error(`❌ Failed to create recovery notification:`, notificationError)
  }
}

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

    // First, check for and recover stuck executions
    await recoverStuckExecutions(supabaseClient)

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
    // Add overall 5-minute timeout for the entire gift selection process
    const overallTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gift selection process timed out after 5 minutes')), 5 * 60 * 1000)
    })

    const giftSelectionPromise = performGiftSelection(supabaseClient, rule, event)
    
    // Race between timeout and actual selection
    const selectedProducts = await Promise.race([
      giftSelectionPromise,
      overallTimeoutPromise
    ]) as any[]
    
    console.log(`🎁 [EXECUTION ${execution.id}] Gift selection completed:`, {
      productCount: selectedProducts?.length || 0,
      products: selectedProducts?.map(p => ({ title: p.title, price: p.price, source: p.fromWishlist ? 'wishlist' : 'search' })) || []
    })
    
    const totalAmount = selectedProducts.reduce((sum: number, product: any) => sum + (product.price || 0), 0)
    console.log(`💰 [EXECUTION ${execution.id}] Calculated total amount: $${totalAmount}`)

    // Update execution with selected products
    console.log(`📝 [EXECUTION ${execution.id}] Updating execution with selected products...`)
    const updateData = {
      selected_products: selectedProducts,
      total_amount: totalAmount,
      status: rule.auto_gifting_settings?.auto_approve_gifts ? 'processing' : 'pending_approval',
      updated_at: new Date().toISOString()
    }
    
    console.log(`📝 [EXECUTION ${execution.id}] Update data:`, {
      productCount: selectedProducts?.length,
      totalAmount,
      status: updateData.status,
      autoApprove: rule.auto_gifting_settings?.auto_approve_gifts
    })

    const { data: updatedExecution, error: updateError } = await supabaseClient
      .from('automated_gift_executions')
      .update(updateData)
      .eq('id', execution.id)
      .select()

    if (updateError) {
      console.error(`❌ [EXECUTION ${execution.id}] Failed to update execution:`, updateError)
      throw new Error(`Execution update failed: ${updateError.message}`)
    }

    console.log(`✅ [EXECUTION ${execution.id}] Successfully updated with ${selectedProducts.length} products (total: $${totalAmount})`)
    console.log(`✅ [EXECUTION ${execution.id}] Updated execution result:`, updatedExecution)

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
    
    // Log detailed error information to database
    await logExecutionError(supabaseClient, execution.id, error, event)
    
    await updateExecutionStatus(supabaseClient, execution.id, 'failed', error.message)
  }
}

async function performGiftSelection(supabaseClient: any, rule: any, event: AutoGiftEvent) {
  return await selectGiftsForExecution(supabaseClient, rule, event)
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
  
  try {
    const searchResults = await performGenericProductSearch(supabaseClient, criteria, event, maxBudget)
    if (searchResults && searchResults.length > 0) {
      return searchResults
    }
  } catch (searchError) {
    console.log('Generic search failed, using emergency fallback:', searchError.message)
  }

  // STEP 4: Emergency fallback - mock/default products
  console.log('🚨 Using emergency default products as final safety net')
  return getEmergencyFallbackProducts(maxBudget, event.event_type)
}

async function performGenericProductSearch(supabaseClient: any, criteria: any, event: AutoGiftEvent, maxBudget: number) {
  // Build search query based on event type and criteria
  let searchQuery = buildSearchQuery(criteria, event)

  console.log(`Searching for gifts with query: "${searchQuery}", budget: $${maxBudget}`)

  // Use the enhanced Zinc API via the get-products function with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Product search timed out after 15 seconds')), 15000)
  })

  const searchPromise = supabaseClient.functions.invoke('get-products', {
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

  const { data: searchResults, error } = await Promise.race([
    searchPromise,
    timeoutPromise
  ]) as any

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
      // Final emergency fallback
      console.log('🚨 No products found even after fallback search, using emergency defaults')
      return getEmergencyFallbackProducts(maxBudget, event.event_type)
    }

    console.log(`Found ${fallbackProducts.length} products from fallback search`)
    return filterAndSelectProducts(fallbackProducts, maxBudget, criteria)
  }

  console.log(`Found ${products.length} products from primary search`)
  return filterAndSelectProducts(products, maxBudget, criteria)
}

async function selectGiftsFromWishlist(supabaseClient: any, rule: any, maxBudget: number) {
  console.log(`🎯 [WISHLIST SELECTION] Starting for recipient ${rule.recipient_id} with budget $${maxBudget}`)
  
  try {
    // STEP 1: Query wishlists with enhanced logging
    console.log(`🎯 [WISHLIST QUERY] Fetching wishlists for recipient ${rule.recipient_id}`)
    
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
          product_source,
          product_url
        )
      `)
      .eq('user_id', rule.recipient_id)
      .not('wishlist_items', 'is', null)

    console.log(`🎯 [WISHLIST QUERY] Query completed. Error:`, wishlistError)
    console.log(`🎯 [WISHLIST QUERY] Result:`, { 
      hasData: !!wishlists, 
      count: wishlists?.length,
      wishlists: wishlists?.map(w => ({ id: w.id, title: w.title, itemCount: w.wishlist_items?.length }))
    })

    if (wishlistError) {
      console.error('❌ [WISHLIST ERROR] Database query failed:', wishlistError)
      throw new Error(`Wishlist fetch failed: ${wishlistError.message}`)
    }

    if (!wishlists || wishlists.length === 0) {
      console.log('⚠️ [WISHLIST EMPTY] No wishlists found for recipient')
      return []
    }

    // STEP 2: Process wishlist items with detailed logging
    console.log(`🎯 [WISHLIST PROCESS] Processing ${wishlists.length} wishlists`)
    
    const allWishlistItems = wishlists.flatMap(wishlist => {
      const items = wishlist.wishlist_items || []
      console.log(`🎯 [WISHLIST ITEMS] Wishlist "${wishlist.title}" has ${items.length} items:`, 
        items.map(item => ({ title: item.title, price: item.price, id: item.product_id }))
      )
      return items
    })

    console.log(`🎯 [WISHLIST TOTAL] Found ${allWishlistItems.length} total wishlist items`)

    // STEP 3: Filter by budget with detailed logging
    const affordableItems = allWishlistItems.filter(item => {
      const hasPrice = item.price && !isNaN(parseFloat(item.price))
      const isAffordable = hasPrice && parseFloat(item.price) <= maxBudget
      
      console.log(`🎯 [BUDGET FILTER] Item "${item.title}": price=${item.price}, hasPrice=${hasPrice}, affordable=${isAffordable}`)
      
      return isAffordable
    })

    console.log(`🎯 [BUDGET RESULT] ${affordableItems.length} items within $${maxBudget} budget:`, 
      affordableItems.map(item => ({ title: item.title, price: item.price }))
    )

    if (affordableItems.length === 0) {
      console.log('⚠️ [WISHLIST BUDGET] No wishlist items found within budget')
      return []
    }

    // STEP 4: Convert to product format with enhanced logging
    console.log(`🎯 [PRODUCT FORMAT] Converting ${affordableItems.length} items to product format`)
    
    const wishlistProducts = affordableItems.map((item, index) => {
      const product = {
        product_id: item.product_id || `wishlist-${index}`,
        id: item.product_id || `wishlist-${index}`,
        title: item.title || 'Untitled Item',
        name: item.title || 'Untitled Item',
        price: parseFloat(item.price) || 0,
        image: item.image_url || '',
        product_url: item.product_url || '',
        fromWishlist: true,
        category: 'wishlist-item',
        retailer: item.product_source || 'unknown',
        // Add default ratings for wishlist items since they don't have reviews
        stars: 4.5, // Default good rating for wishlist items
        num_reviews: 10 // Default review count
      }
      
      console.log(`🎯 [PRODUCT CONVERT] Item ${index + 1}:`, product)
      return product
    })

    // STEP 5: Apply wishlist-specific filtering
    console.log(`🎯 [WISHLIST FILTER] Applying wishlist-specific filtering to ${wishlistProducts.length} products`)
    const selectedProducts = filterWishlistProducts(wishlistProducts, maxBudget)
    
    console.log(`✅ [WISHLIST SUCCESS] Selected ${selectedProducts.length} products from wishlist`)
    return selectedProducts

  } catch (error) {
    console.error('❌ [WISHLIST ERROR] Exception in selectGiftsFromWishlist:', error)
    throw error
  }
}

// New wishlist-specific filtering function
function filterWishlistProducts(products: any[], maxBudget: number): any[] {
  console.log(`🎯 [WISHLIST FILTER] Filtering ${products.length} wishlist products with budget $${maxBudget}`)
  
  // Filter by budget (already done, but double-check)
  const budgetFiltered = products.filter(product => {
    const price = parseFloat(product.price) || 0
    const isValid = price > 0 && price <= maxBudget
    console.log(`🎯 [BUDGET CHECK] "${product.title}": $${price} - ${isValid ? 'VALID' : 'INVALID'}`)
    return isValid
  })

  console.log(`🎯 [BUDGET FINAL] ${budgetFiltered.length} products pass budget filter`)

  if (budgetFiltered.length === 0) {
    console.log('⚠️ [WISHLIST FILTER] No products passed budget filter')
    return []
  }

  // Sort wishlist items by preference (higher price = more wanted?)
  const sorted = budgetFiltered.sort((a, b) => {
    const priceA = parseFloat(a.price) || 0
    const priceB = parseFloat(b.price) || 0
    return priceB - priceA // Higher price first (assuming more desired items cost more)
  })

  console.log(`🎯 [SORT RESULT] Sorted products:`, sorted.map(p => ({ title: p.title, price: p.price })))

  // Select up to 3 products, prioritizing variety
  const selected = sorted.slice(0, 3).map((product, index) => ({
    ...product,
    selected: true,
    selection_reason: `Wishlist item ${index + 1}: Direct recipient preference`
  }))

  console.log(`✅ [SELECTION FINAL] Selected ${selected.length} wishlist products:`, 
    selected.map(p => ({ title: p.title, price: p.price, reason: p.selection_reason }))
  )

  return selected
}

async function selectGiftsWithNicoleAI(supabaseClient: any, rule: any, event: AutoGiftEvent) {
  console.log(`🤖 [NICOLE AI] Starting enhanced gift selection for rule ${rule.id}`)
  
  try {
    // Add timeout wrapper for Nicole AI call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Nicole AI selection timed out after 30 seconds')), 30000)
    })

    const nicolePromise = supabaseClient.functions.invoke('nicole-chatgpt-agent', {
      body: {
        message: `Please help me find the perfect gift for someone. Here are the details:
- Budget: $${rule.budget_limit || 50}
- Occasion: ${event.event_type}
- Recipient ID: ${rule.recipient_id}
- Gift preferences: ${JSON.stringify(rule.gift_selection_criteria || {})}
- Event date: ${event.event_date}

Please suggest 3-5 thoughtful gift options within the budget.`,
        userId: rule.user_id,
        context: 'auto_gift_execution',
        executionId: event.event_id || `rule-${rule.id}`,
        metadata: {
          rule_id: rule.id,
          recipient_id: rule.recipient_id,
          budget: rule.budget_limit,
          occasion: event.event_type,
          selection_criteria: rule.gift_selection_criteria
        }
      }
    })

    // Race between timeout and actual call
    const { data: nicoleResponse, error: nicoleError } = await Promise.race([
      nicolePromise,
      timeoutPromise
    ]) as any

    if (nicoleError) {
      console.error('❌ [NICOLE AI] Error calling Nicole agent:', nicoleError)
      throw new Error(`Nicole AI selection failed: ${nicoleError.message || 'Unknown error'}`)
    }

    console.log('🤖 [NICOLE AI] Raw response received:', { hasData: !!nicoleResponse, data: nicoleResponse })

    // Extract products from Nicole's response
    const products = nicoleResponse?.products || []
    
    if (!products || products.length === 0) {
      console.log('🤖 [NICOLE AI] No products returned from Nicole')
      return { products: [], confidence: 0, aiAttribution: null }
    }

    console.log(`🤖 [NICOLE AI] Successfully selected ${products.length} products with Nicole's help`)
    
    const aiAttribution = {
      agent: 'nicole',
      data_sources: ['ai_analysis', 'preference_matching'],
      confidence_score: nicoleResponse.confidence || 0.85,
      discovery_method: 'nicole_ai_selection',
      selection_context: {
        budget: rule.budget_limit,
        occasion: event.event_type,
        criteria: rule.gift_selection_criteria,
        response_quality: products.length > 0 ? 'high' : 'low'
      }
    }

    return {
      products: products.slice(0, 5), // Limit to 5 products
      confidence: nicoleResponse.confidence || 0.85,
      aiAttribution
    }

  } catch (error) {
    console.error('❌ [NICOLE AI] Exception in Nicole selection:', error)
    // If it's a timeout error, log specifically
    if (error.message?.includes('timed out')) {
      console.error('⏰ [NICOLE AI] Selection timed out - this execution may be stuck')
    }
    throw error
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
