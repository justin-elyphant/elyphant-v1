/**
 * Emergency fallback products when all other selection methods fail
 */
function getEmergencyFallbackProducts(maxBudget: number, eventType: string): any[] {
  console.log(`🚨 [EMERGENCY FALLBACK] Generating default products for ${eventType}, budget: $${maxBudget}`)
  
  // Define emergency fallback products based on budget and occasion
  const emergencyProducts = [
    {
      product_id: 'emergency-gift-card-1',
      id: 'emergency-gift-card-1',
      title: 'Amazon Gift Card',
      name: 'Amazon Gift Card',
      price: Math.min(25, maxBudget),
      image: 'https://picsum.photos/seed/giftcard/300/300',
      category: 'gift-cards',
      retailer: 'Amazon',
      stars: 5.0,
      num_reviews: 1000,
      source: 'emergency_fallback',
      description: 'Amazon gift card - always a perfect choice'
    },
    {
      product_id: 'emergency-flowers-1',
      id: 'emergency-flowers-1',
      title: 'Fresh Flower Bouquet',
      name: 'Fresh Flower Bouquet',
      price: Math.min(35, maxBudget),
      image: 'https://picsum.photos/seed/flowers/300/300',
      category: 'flowers',
      retailer: 'Local Florist',
      stars: 4.8,
      num_reviews: 500,
      source: 'emergency_fallback',
      description: 'Beautiful fresh flower arrangement'
    },
    {
      product_id: 'emergency-chocolate-1',
      id: 'emergency-chocolate-1',
      title: 'Gourmet Chocolate Box',
      name: 'Gourmet Chocolate Box',
      price: Math.min(20, maxBudget),
      image: 'https://picsum.photos/seed/chocolate/300/300',
      category: 'food',
      retailer: 'Gourmet Foods',
      stars: 4.7,
      num_reviews: 300,
      source: 'emergency_fallback',
      description: 'Premium assorted chocolate collection'
    }
  ]

  // Filter by budget and select appropriate products
  const affordableProducts = emergencyProducts.filter(product => product.price <= maxBudget)
  
  // Choose products based on event type
  let selectedProducts = []
  
  switch (eventType.toLowerCase()) {
    case 'birthday':
    case 'anniversary':
      selectedProducts = affordableProducts.filter(p => p.category !== 'flowers').slice(0, 2)
      break
    case 'valentine':
    case 'valentines':
      selectedProducts = affordableProducts.filter(p => ['flowers', 'food'].includes(p.category)).slice(0, 2)
      break
    case 'graduation':
    case 'promotion':
      selectedProducts = [affordableProducts.find(p => p.category === 'gift-cards') || affordableProducts[0]]
      break
    default:
      selectedProducts = affordableProducts.slice(0, 1) // Default to gift card
  }

  console.log(`🚨 [EMERGENCY FALLBACK] Selected ${selectedProducts.length} emergency products:`, 
    selectedProducts.map(p => ({ title: p.title, price: p.price }))
  )
  
  return selectedProducts.length > 0 ? selectedProducts : [emergencyProducts[0]] // Always return at least one
}

/**
 * Log detailed error information to database for debugging
 */
async function logExecutionError(supabaseClient: any, executionId: string, error: any, event: AutoGiftEvent) {
  try {
    console.log(`📊 [ERROR LOGGING] Logging error for execution ${executionId}`)
    
    const errorDetails = {
      execution_id: executionId,
      error_type: error.name || 'UnknownError',
      error_message: error.message || 'Unknown error occurred',
      error_stack: error.stack || null,
      event_context: {
        event_id: event.event_id,
        event_type: event.event_type,
        rule_id: event.rule_id,
        user_id: event.user_id,
        budget_limit: event.budget_limit
      },
      timestamp: new Date().toISOString(),
      is_timeout: error.message?.includes('timed out') || false,
      is_network_error: error.message?.includes('fetch') || error.message?.includes('network') || false
    }

    // Insert error log into auto_gift_notifications for user visibility
    await supabaseClient
      .from('auto_gift_notifications')
      .insert({
        user_id: event.user_id,
        execution_id: executionId,
        notification_type: 'execution_error',
        title: 'Auto-Gift Processing Error',
        message: `Gift selection failed: ${error.message}. This execution will be retried automatically.`,
        email_sent: false,
        is_read: false
      })

    console.log(`✅ [ERROR LOGGING] Error logged successfully for execution ${executionId}`)
    
  } catch (logError) {
    console.error(`❌ [ERROR LOGGING] Failed to log error for execution ${executionId}:`, logError)
  }
}