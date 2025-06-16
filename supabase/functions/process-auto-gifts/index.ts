
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
  console.log(`Processing auto-gift for event ${event.event_id}`)

  // Check if execution already exists
  const { data: existingExecution } = await supabaseClient
    .from('automated_gift_executions')
    .select('id, status')
    .eq('event_id', event.event_id)
    .eq('rule_id', event.rule_id)
    .single()

  if (existingExecution && existingExecution.status !== 'failed') {
    console.log(`Execution already exists for event ${event.event_id}`)
    return
  }

  // Create new execution record
  const { data: execution, error: executionError } = await supabaseClient
    .from('automated_gift_executions')
    .insert({
      rule_id: event.rule_id,
      event_id: event.event_id,
      user_id: event.user_id,
      execution_date: event.event_date,
      status: 'pending'
    })
    .select()
    .single()

  if (executionError) {
    console.error('Error creating execution:', executionError)
    throw executionError
  }

  console.log(`Created execution ${execution.id} for event ${event.event_id}`)

  // Get the auto-gifting rule details
  const { data: rule, error: ruleError } = await supabaseClient
    .from('auto_gifting_rules')
    .select('*, auto_gifting_settings(*)')
    .eq('id', event.rule_id)
    .single()

  if (ruleError) {
    console.error('Error fetching rule:', ruleError)
    await updateExecutionStatus(supabaseClient, execution.id, 'failed', 'Failed to fetch rule details')
    return
  }

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
        status: rule.auto_gifting_settings?.auto_approve_gifts ? 'processing' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    console.log(`Updated execution ${execution.id} with ${selectedProducts.length} selected products`)

    // If auto-approve is enabled, proceed with order creation
    if (rule.auto_gifting_settings?.auto_approve_gifts && selectedProducts.length > 0) {
      await createAutoGiftOrder(supabaseClient, execution.id, selectedProducts, rule)
    }

  } catch (error) {
    console.error(`Error processing gifts for execution ${execution.id}:`, error)
    await updateExecutionStatus(supabaseClient, execution.id, 'failed', error.message)
  }
}

async function selectGiftsForExecution(supabaseClient: any, rule: any, event: AutoGiftEvent) {
  const criteria = rule.gift_selection_criteria || {}
  const maxBudget = rule.budget_limit || 50

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
    throw new Error(`Product search failed: ${error.message}`)
  }

  if (!searchResults?.products || searchResults.products.length === 0) {
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

    if (fallbackError || !fallbackResults?.products || fallbackResults.products.length === 0) {
      throw new Error('No suitable products found for auto-gifting')
    }

    return filterAndSelectProducts(fallbackResults.products, maxBudget, criteria)
  }

  return filterAndSelectProducts(searchResults.products, maxBudget, criteria)
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
  console.log(`Creating auto-gift order for execution ${executionId}`)
  
  // This would integrate with your existing order processing system
  // For now, we'll just update the execution status to indicate processing
  await updateExecutionStatus(supabaseClient, executionId, 'processing', 'Order creation initiated')
  
  // TODO: Integrate with actual order creation logic
  // This would involve creating an order record and processing payment
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
