import { ParsedContext } from "./enhancedContextParser";
import { GroupedSearchResults, CategoryResults } from "./multiCategorySearchService";
import { Product } from "@/contexts/ProductContext";

export interface ConversationState {
  previousSearchResults?: GroupedSearchResults;
  userInteractions: CategoryInteraction[];
  preferredCategories: string[];
  crossCategoryMappings: Record<string, string[]>;
}

export interface CategoryInteraction {
  categoryName: string;
  action: 'viewed' | 'expanded' | 'requested_more' | 'dismissed';
  timestamp: Date;
  products?: Product[];
}

export interface CategoryFollowUpRequest {
  type: 'show_more' | 'refine' | 'cross_category' | 'similar';
  categoryName: string;
  refinementCriteria?: {
    priceRange?: [number, number];
    brands?: string[];
    excludeViewed?: boolean;
  };
}

export interface CrossCategorySuggestion {
  fromCategory: string;
  toCategory: string;
  reasoning: string;
  confidence: number;
  suggestedProducts?: Product[];
}

/**
 * Enhanced conversation service for category-specific interactions
 */
export class ConversationEnhancementService {
  private static conversationState: ConversationState = {
    userInteractions: [],
    preferredCategories: [],
    crossCategoryMappings: {
      'cooking': ['travel', 'kitchen', 'outdoor-gear'],
      'travel': ['cooking', 'outdoor-gear', 'electronics'],
      'fitness': ['athletic-wear', 'outdoor-gear', 'travel'],
      'athletic-wear': ['fitness', 'outdoor-gear', 'travel'],
      'electronics': ['travel', 'gaming', 'photography'],
      'outdoor-gear': ['travel', 'fitness', 'cooking']
    }
  };

  /**
   * Parse user message for category-specific requests
   */
  static parseFollowUpRequest(message: string, previousResults?: GroupedSearchResults): CategoryFollowUpRequest | null {
    const lowerMessage = message.toLowerCase();
    
    // Pattern matching for category-specific requests
    const showMorePatterns = [
      /show me more (.*?)(items?|products?|options?)/i,
      /more (.*?)(stuff|things|items?|products?)/i,
      /other (.*?)(items?|products?|options?)/i,
      /additional (.*?)(items?|products?|gear)/i
    ];

    const refinePatterns = [
      /cheaper (.*?)(items?|products?|options?)/i,
      /under \$(\d+) (.*?)(items?|products?)/i,
      /better (.*?)(items?|products?|options?)/i
    ];

    // Check for "show more" requests
    for (const pattern of showMorePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const categoryHint = match[1].trim();
        const matchedCategory = this.findMatchingCategory(categoryHint, previousResults);
        
        if (matchedCategory) {
          return {
            type: 'show_more',
            categoryName: matchedCategory,
            refinementCriteria: { excludeViewed: true }
          };
        }
      }
    }

    // Check for refinement requests
    for (const pattern of refinePatterns) {
      const match = message.match(pattern);
      if (match) {
        const categoryHint = match.length > 2 ? match[2]?.trim() : '';
        const matchedCategory = this.findMatchingCategory(categoryHint || 'general', previousResults);
        
        const refinementCriteria: any = {};
        
        // Extract price constraints
        const priceMatch = message.match(/under \$(\d+)/i);
        if (priceMatch) {
          const maxPrice = parseInt(priceMatch[1]);
          refinementCriteria.priceRange = [0, maxPrice];
        }

        return {
          type: 'refine',
          categoryName: matchedCategory || 'general',
          refinementCriteria
        };
      }
    }

    return null;
  }

  /**
   * Find matching category from user input
   */
  private static findMatchingCategory(categoryHint: string, previousResults?: GroupedSearchResults): string | null {
    if (!previousResults) return null;

    const hint = categoryHint.toLowerCase();
    
    // Direct category name matches
    const directMatch = previousResults.categories.find(cat => 
      cat.categoryName.toLowerCase().includes(hint) ||
      cat.displayName.toLowerCase().includes(hint) ||
      hint.includes(cat.categoryName.toLowerCase())
    );

    if (directMatch) {
      return directMatch.categoryName;
    }

    // Keyword-based matching
    const keywordMappings: Record<string, string[]> = {
      'cooking': ['cook', 'kitchen', 'chef', 'food', 'recipe'],
      'travel': ['travel', 'trip', 'vacation', 'luggage', 'journey'],
      'fitness': ['fitness', 'gym', 'workout', 'exercise', 'training'],
      'athletic-wear': ['athletic', 'sports', 'workout', 'active', 'running'],
      'electronics': ['tech', 'electronic', 'gadget', 'device', 'digital'],
      'outdoor-gear': ['outdoor', 'camping', 'hiking', 'adventure', 'nature']
    };

    for (const [category, keywords] of Object.entries(keywordMappings)) {
      if (keywords.some(keyword => hint.includes(keyword))) {
        const categoryExists = previousResults.categories.some(cat => cat.categoryName === category);
        if (categoryExists) {
          return category;
        }
      }
    }

    return null;
  }

  /**
   * Generate cross-category suggestions
   */
  static generateCrossCategorySuggestions(
    currentCategory: string,
    userContext: ParsedContext
  ): CrossCategorySuggestion[] {
    const suggestions: CrossCategorySuggestion[] = [];
    const relatedCategories = this.conversationState.crossCategoryMappings[currentCategory] || [];

    for (const relatedCategory of relatedCategories) {
      const suggestion = this.buildCrossCategorySuggestion(currentCategory, relatedCategory, userContext);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  }

  /**
   * Build individual cross-category suggestion
   */
  private static buildCrossCategorySuggestion(
    fromCategory: string,
    toCategory: string,
    userContext: ParsedContext
  ): CrossCategorySuggestion | null {
    const reasoningMap: Record<string, Record<string, string>> = {
      'cooking': {
        'travel': 'portable cooking gear for food lovers who travel',
        'outdoor-gear': 'camping cookware for outdoor cooking adventures'
      },
      'travel': {
        'cooking': 'kitchen essentials that work great for travelers',
        'electronics': 'travel-friendly tech gadgets and accessories'
      },
      'fitness': {
        'athletic-wear': 'workout clothing to complement your fitness routine',
        'travel': 'travel gear for fitness enthusiasts on the go'
      }
    };

    const reasoning = reasoningMap[fromCategory]?.[toCategory];
    if (!reasoning) return null;

    // Calculate confidence based on user context
    let confidence = 0.6; // Base confidence

    // Boost if user has shown interest in both categories
    if (userContext.interests.some(interest => 
      interest.toLowerCase().includes(fromCategory) || interest.toLowerCase().includes(toCategory)
    )) {
      confidence += 0.2;
    }

    // Boost if categories complement user's profile
    if (userContext.recipient && userContext.occasion) {
      confidence += 0.1;
    }

    return {
      fromCategory,
      toCategory,
      reasoning,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Track user interaction with categories
   */
  static trackCategoryInteraction(interaction: CategoryInteraction): void {
    this.conversationState.userInteractions.push(interaction);
    
    // Update preferred categories based on interactions
    if (interaction.action === 'expanded' || interaction.action === 'requested_more') {
      if (!this.conversationState.preferredCategories.includes(interaction.categoryName)) {
        this.conversationState.preferredCategories.push(interaction.categoryName);
      }
    }

    // Keep only last 10 interactions to prevent memory bloat
    if (this.conversationState.userInteractions.length > 10) {
      this.conversationState.userInteractions = this.conversationState.userInteractions.slice(-10);
    }
  }

  /**
   * Get user's preferred categories based on interaction history
   */
  static getPreferredCategories(): string[] {
    return [...this.conversationState.preferredCategories];
  }

  /**
   * Update conversation state with search results
   */
  static updateConversationState(results: GroupedSearchResults): void {
    this.conversationState.previousSearchResults = results;
  }

  /**
   * Generate category-specific follow-up messages
   */
  static generateFollowUpMessage(request: CategoryFollowUpRequest): string {
    const categoryDisplayNames: Record<string, string> = {
      'cooking': 'cooking essentials',
      'travel': 'travel gear',
      'fitness': 'fitness equipment',
      'athletic-wear': 'athletic wear',
      'electronics': 'tech products',
      'outdoor-gear': 'outdoor gear'
    };

    const displayName = categoryDisplayNames[request.categoryName] || request.categoryName;

    switch (request.type) {
      case 'show_more':
        return `I'll find more ${displayName} options for you. Let me search for additional items that might be perfect!`;
      case 'refine':
        if (request.refinementCriteria?.priceRange) {
          const [, max] = request.refinementCriteria.priceRange;
          return `Looking for ${displayName} under $${max}. Let me find some great budget-friendly options!`;
        }
        return `I'll refine the ${displayName} results to better match what you're looking for.`;
      case 'cross_category':
        return `Based on your interest in ${displayName}, I think you might also like some related items from other categories!`;
      default:
        return `Let me help you explore more ${displayName} options.`;
    }
  }
}
