/**
 * Emergency fallback products when all other selection methods fail
 */
// Enhanced emergency fallback with invitation context intelligence
export function getEmergencyFallbackProducts(
  maxBudget: number, 
  eventType: string, 
  invitationContext?: {
    relationshipType?: string;
    recipientDemographics?: any;
    urgencyLevel?: number; // days until event
    inviterPreferences?: any;
  }
): any[] {
  console.log(`🆘 Generating enhanced emergency fallback products for ${eventType} with budget $${maxBudget}`);
  console.log(`📋 Invitation context:`, invitationContext);
  
  const isUrgent = (invitationContext?.urgencyLevel || 0) <= 7;
  const relationship = invitationContext?.relationshipType || 'friend';
  const demographics = invitationContext?.recipientDemographics || {};
  
  // Relationship-based product categories
  const getRelationshipAppropriateProducts = () => {
    const baseProducts = [];
    
    switch (relationship.toLowerCase()) {
      case 'spouse':
      case 'partner':
      case 'romantic':
        baseProducts.push(
          createProduct('jewelry', 'Elegant Jewelry Piece', maxBudget * 0.8, 'Jewelry & Accessories', 'Beautiful jewelry perfect for your special someone'),
          createProduct('flowers', 'Premium Rose Bouquet', maxBudget * 0.4, 'Flowers & Plants', 'Romantic roses to express your love'),
          createProduct('experience', 'Couples Experience Gift', maxBudget * 0.9, 'Experiences', 'Memorable experience to share together')
        );
        break;
        
      case 'family':
      case 'parent':
      case 'child':
      case 'sibling':
        baseProducts.push(
          createProduct('family-photo', 'Custom Photo Frame', maxBudget * 0.5, 'Home & Decor', 'Beautiful frame for cherished family memories'),
          createProduct('comfort', 'Cozy Home Comfort Set', maxBudget * 0.7, 'Home & Living', 'Comfortable items for relaxing at home'),
          createProduct('cooking', 'Gourmet Cooking Set', maxBudget * 0.6, 'Kitchen & Dining', 'Premium cooking essentials for family meals')
        );
        break;
        
      case 'friend':
      case 'close_friend':
      default:
        baseProducts.push(
          createProduct('hobby', 'Hobby & Interest Kit', maxBudget * 0.7, 'Hobbies & Crafts', 'Fun kit related to their interests'),
          createProduct('entertainment', 'Entertainment Package', maxBudget * 0.6, 'Entertainment', 'Books, games, or media for enjoyment'),
          createProduct('wellness', 'Self-Care Wellness Set', maxBudget * 0.8, 'Health & Beauty', 'Relaxing wellness items for self-care')
        );
        break;
    }
    
    return baseProducts;
  };
  
  // Event-type specific intelligence
  const getEventSpecificProducts = () => {
    const eventProducts = [];
    
    switch (eventType.toLowerCase()) {
      case 'birthday':
        eventProducts.push(
          createProduct('birthday-special', 'Birthday Celebration Set', maxBudget * 0.7, 'Celebrations', 'Complete birthday celebration package'),
          createProduct('age-appropriate', 'Age-Appropriate Gift', maxBudget * 0.6, 'Lifestyle', 'Perfect for their age and lifestyle')
        );
        break;
        
      case 'anniversary':
        eventProducts.push(
          createProduct('memory', 'Memory Keepsake', maxBudget * 0.8, 'Keepsakes', 'Beautiful keepsake to commemorate your anniversary'),
          createProduct('celebration', 'Anniversary Celebration', maxBudget * 0.9, 'Experiences', 'Special way to celebrate your milestone')
        );
        break;
        
      case 'holiday':
      case 'christmas':
      case 'hanukkah':
        eventProducts.push(
          createProduct('holiday-decor', 'Holiday Decoration Set', maxBudget * 0.5, 'Holiday & Seasonal', 'Beautiful decorations for the season'),
          createProduct('holiday-treat', 'Holiday Treat Collection', maxBudget * 0.4, 'Food & Treats', 'Delicious seasonal treats to enjoy')
        );
        break;
        
      case 'graduation':
        eventProducts.push(
          createProduct('professional', 'Professional Starter Kit', maxBudget * 0.8, 'Professional', 'Essential items for their new journey'),
          createProduct('achievement', 'Achievement Recognition', maxBudget * 0.6, 'Awards & Recognition', 'Beautiful way to honor their accomplishment')
        );
        break;
        
      default:
        eventProducts.push(
          createProduct('general-celebration', 'Celebration Gift Set', maxBudget * 0.7, 'General', 'Perfect gift for any special occasion')
        );
    }
    
    return eventProducts;
  };
  
  // Demographic smart defaults
  const getDemographicProducts = () => {
    const demoProducts = [];
    const age = demographics.age || demographics.age_range;
    const gender = demographics.gender;
    
    if (age) {
      if (age < 25 || (typeof age === 'string' && age.includes('teen'))) {
        demoProducts.push(
          createProduct('tech-accessories', 'Tech Accessories Set', maxBudget * 0.6, 'Technology', 'Cool tech accessories for young adults'),
          createProduct('trendy', 'Trendy Lifestyle Items', maxBudget * 0.7, 'Lifestyle', 'On-trend items perfect for their age')
        );
      } else if (age > 50 || (typeof age === 'string' && age.includes('senior'))) {
        demoProducts.push(
          createProduct('comfort', 'Comfort & Relaxation Set', maxBudget * 0.8, 'Comfort', 'Comfortable items for relaxation'),
          createProduct('classic', 'Classic Quality Items', maxBudget * 0.7, 'Classic', 'Timeless, high-quality gifts')
        );
      }
    }
    
    return demoProducts;
  };
  
  // Create urgency-optimized products for short notice
  const getUrgentDeliveryProducts = () => {
    if (!isUrgent) return [];
    
    return [
      createProduct('digital-gift', 'Digital Gift Experience', maxBudget * 0.6, 'Digital', 'Instant digital gift delivered immediately', true),
      createProduct('local-same-day', 'Local Same-Day Delivery', maxBudget * 0.8, 'Local', 'Available for same-day local delivery', true),
      createProduct('subscription', 'Premium Subscription Service', maxBudget * 0.5, 'Subscriptions', 'Instant access to premium services', true)
    ];
  };
  
  // Helper function to create standardized product objects
  function createProduct(
    id: string, 
    name: string, 
    price: number, 
    category: string, 
    description: string, 
    isDigital: boolean = false
  ) {
    const actualPrice = Math.min(Math.max(price, 10), maxBudget); // Ensure price is within bounds
    
    return {
      id: `emergency-${id}-${Date.now()}`,
      product_id: `emergency-${id}-${Date.now()}`,
      title: name,
      product_name: name,
      name: name,
      price: actualPrice,
      image: null,
      image_url: null,
      source: 'enhanced_emergency_fallback',
      vendor: isDigital ? 'Digital Delivery' : 'Multiple Vendors',
      category: category,
      description: description,
      features: [
        isDigital ? "Instant delivery" : "Fast delivery available",
        "Perfect for the occasion",
        "Thoughtfully selected",
        ...(isUrgent ? ["Urgency-optimized"] : [])
      ],
      availability: 'in_stock',
      urgent_delivery: isUrgent,
      is_digital: isDigital,
      relationship_match: relationship,
      event_match: eventType,
      confidence_score: 0.7 + (isUrgent ? 0.1 : 0) + (relationship !== 'friend' ? 0.1 : 0)
    };
  }
  
  // Combine all product sources
  const allProducts = [
    ...getRelationshipAppropriateProducts(),
    ...getEventSpecificProducts(),
    ...getDemographicProducts(),
    ...getUrgentDeliveryProducts(),
    // Always include some universal options
    createProduct('gift-card', 'Premium Gift Card', maxBudget * 0.8, 'Gift Cards', 'Versatile gift card allowing recipient choice'),
    createProduct('flowers', 'Fresh Flower Bouquet', maxBudget * 0.4, 'Flowers & Plants', 'Beautiful fresh flower arrangement'),
    createProduct('chocolates', 'Gourmet Chocolate Collection', maxBudget * 0.3, 'Food & Treats', 'Premium chocolate selection')
  ];
  
  // Filter and prioritize products
  const suitableProducts = allProducts
    .filter(p => p.price <= maxBudget)
    .sort((a, b) => {
      // Prioritize urgent delivery if needed
      if (isUrgent && a.urgent_delivery !== b.urgent_delivery) {
        return b.urgent_delivery ? 1 : -1;
      }
      // Then by confidence score
      return (b.confidence_score || 0.5) - (a.confidence_score || 0.5);
    })
    .slice(0, 8); // Limit to top 8 options
  
  console.log(`🎁 Generated ${suitableProducts.length} enhanced emergency fallback products`);
  console.log(`📊 Products include: ${suitableProducts.map(p => p.category).join(', ')}`);
  
  return suitableProducts;
}

/**
 * Log detailed error information to database for debugging
 */
async function logExecutionError(supabaseClient: any, executionId: string, error: any, event: any) {
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