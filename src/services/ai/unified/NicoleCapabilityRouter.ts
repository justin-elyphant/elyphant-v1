import { NicoleCapability, UnifiedNicoleContext, NicoleCapabilityConfig } from "./types";

export class NicoleCapabilityRouter {
  private capabilities: NicoleCapabilityConfig[] = [
    {
      name: 'gift_advisor',
      description: 'Comprehensive gift recommendation and advisory',
      triggers: ['gift advisor', 'help me find', 'recommend', 'suggest gift', 'gift idea', 'quick gift', 'quick-gift'],
      contextRequirements: [],
      availableActions: ['start_gift_flow', 'analyze_preferences', 'generate_recommendations', 'collect_recipient_info', 'collect_payment', 'send_sms', 'process_gift']
    },
    {
      name: 'search',
      description: 'Product search and marketplace queries',
      triggers: ['search for', 'find products', 'looking for', 'show me'],
      contextRequirements: [],
      availableActions: ['search_products', 'filter_results', 'navigate_marketplace']
    },
    {
      name: 'auto_gifting',
      description: 'Automated gifting setup and management',
      triggers: ['auto gift', 'automatic', 'set up gifting', 'recurring gift'],
      contextRequirements: ['recipient'],
      availableActions: ['setup_auto_gifting', 'manage_rules', 'predict_opportunities']
    },
    {
      name: 'budget_analysis',
      description: 'Budget planning and spending analysis',
      triggers: ['budget', 'spending', 'how much', 'price range', 'afford'],
      contextRequirements: [],
      availableActions: ['analyze_budget', 'suggest_budget', 'track_spending']
    },
    {
      name: 'wishlist_analysis',
      description: 'Wishlist compatibility and analysis',
      triggers: ['wishlist', 'want list', 'saved items'],
      contextRequirements: ['recipient'],
      availableActions: ['analyze_wishlist', 'suggest_from_wishlist', 'wishlist_compatibility']
    },
    {
      name: 'marketplace_assistant',
      description: 'Marketplace navigation and assistance',
      triggers: ['marketplace', 'store', 'buy', 'purchase', 'order'],
      contextRequirements: [],
      availableActions: ['navigate_marketplace', 'assist_purchase', 'track_order']
    },
    {
      name: 'conversation',
      description: 'General conversation and context building',
      triggers: [], // Default fallback
      contextRequirements: [],
      availableActions: ['continue_conversation', 'gather_context', 'provide_info']
    }
  ];

  /**
   * Determine the primary capability needed for a message
   */
  determineCapability(message: string, context: UnifiedNicoleContext): NicoleCapability {
    const messageLower = message.toLowerCase();
    
    // Check for explicit capability triggers
    for (const capability of this.capabilities) {
      if (capability.name === 'conversation') continue; // Skip default
      
      for (const trigger of capability.triggers) {
        if (messageLower.includes(trigger.toLowerCase())) {
          // Check if context requirements are met
          if (this.areRequirementsMet(capability, context)) {
            return capability.name;
          }
        }
      }
    }

    // Context-based routing
    if (context.recipient && context.occasion && messageLower.includes('gift')) {
      return 'gift_advisor';
    }

    if (messageLower.includes('search') || messageLower.includes('find')) {
      return 'search';
    }

    if (context.conversationPhase === 'recommendation_ready') {
      return 'gift_advisor';
    }

    // Default to conversation
    return 'conversation';
  }

  /**
   * Get all available capabilities for current context
   */
  getAvailableCapabilities(context: UnifiedNicoleContext): NicoleCapability[] {
    return this.capabilities
      .filter(capability => this.areRequirementsMet(capability, context))
      .map(capability => capability.name);
  }

  /**
   * Get capability configuration
   */
  getCapabilityConfig(capability: NicoleCapability): NicoleCapabilityConfig | undefined {
    return this.capabilities.find(c => c.name === capability);
  }

  /**
   * Check if a capability can handle a specific action
   */
  canHandleAction(capability: NicoleCapability, action: string): boolean {
    const config = this.getCapabilityConfig(capability);
    return config?.availableActions.includes(action) || false;
  }

  /**
   * Get suggested next capabilities based on context
   */
  getSuggestedCapabilities(context: UnifiedNicoleContext): NicoleCapability[] {
    const suggestions: NicoleCapability[] = [];

    // Context-based suggestions
    if (context.recipient && !context.occasion) {
      suggestions.push('gift_advisor');
    }

    if (context.recipient && context.occasion && !context.budget) {
      suggestions.push('budget_analysis');
    }

    if (context.recipient && context.occasion && context.budget) {
      suggestions.push('search', 'gift_advisor');
    }

    if (context.interests && context.interests.length > 0) {
      suggestions.push('search', 'marketplace_assistant');
    }

    if (context.detectedBrands && context.detectedBrands.length > 0) {
      suggestions.push('search');
    }

    // Remove duplicates and return
    return [...new Set(suggestions)];
  }

  private areRequirementsMet(capability: NicoleCapabilityConfig, context: UnifiedNicoleContext): boolean {
    for (const requirement of capability.contextRequirements) {
      switch (requirement) {
        case 'recipient':
          if (!context.recipient) return false;
          break;
        case 'occasion':
          if (!context.occasion) return false;
          break;
        case 'budget':
          if (!context.budget) return false;
          break;
        // Add more requirements as needed
      }
    }
    return true;
  }
}