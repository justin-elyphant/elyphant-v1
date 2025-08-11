import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/contexts/ProductContext";

/**
 * **PHASE 1: Direct Nicole → API Pipeline Service**
 * Handles direct integration between Nicole AI chat and marketplace API
 * Eliminates URL parameter dependency and ensures context preservation
 */
export class DirectNicoleMarketplaceService {
  private static instance: DirectNicoleMarketplaceService;

  static getInstance(): DirectNicoleMarketplaceService {
    if (!DirectNicoleMarketplaceService.instance) {
      DirectNicoleMarketplaceService.instance = new DirectNicoleMarketplaceService();
    }
    return DirectNicoleMarketplaceService.instance;
  }

  /**
   * **PHASE 3: Nicole-Aware Product Search**
   * Direct API call with guaranteed context preservation
   */
  async searchWithNicoleContext(
    query: string, 
    nicoleContext: any,
    options: {
      maxResults?: number;
      useCache?: boolean;
    } = {}
  ): Promise<Product[]> {
    try {
      console.log('🎯 DirectNicole: Starting search with preserved context:', { query, nicoleContext });

      // **PHASE 2: Unified Budget Format**
      const standardizedBudget = this.standardizeBudget(nicoleContext.budget);
      
      // **PHASE 4: Experience-to-Product Translation**
      const enhancedQuery = this.translateExperiencesToProducts(query, nicoleContext.interests);

      // Direct call to zinc-search with full context
      const { data, error } = await supabase.functions.invoke('zinc-search', {
        body: {
          query: enhancedQuery,
          maxResults: options.maxResults || 35,
          nicoleContext: {
            ...nicoleContext,
            budget: standardizedBudget
          },
          // **PHASE 2: All Budget Format Support**
          minPrice: standardizedBudget?.min,
          maxPrice: standardizedBudget?.max,
          min_price: standardizedBudget?.min,
          max_price: standardizedBudget?.max
        }
      });

      if (error) {
        console.error('🎯 DirectNicole: Zinc API error:', error);
        throw new Error(`Zinc API error: ${error.message}`);
      }

      console.log(`🎯 DirectNicole: Received ${data?.results?.length || 0} products from Zinc API`);

      // **PHASE 5: Interest Relevance Validation**
      const products = this.validateProductRelevance(data?.results || [], nicoleContext);

      // **PHASE 6: Smart Fallback Logic**
      if (products.length === 0) {
        console.log('🎯 DirectNicole: No results, trying smart fallback');
        return this.handleSmartFallback(query, nicoleContext);
      }

      return products;
    } catch (error) {
      console.error('🎯 DirectNicole: Search error:', error);
      
      // **PHASE 6: Context-Aware Fallback**
      return this.handleSmartFallback(query, nicoleContext);
    }
  }

  /**
   * **PHASE 2: Unified Budget Handling**
   */
  private standardizeBudget(budget: any): { min: number; max: number } | null {
    if (!budget) return null;

    // Handle array format [min, max]
    if (Array.isArray(budget) && budget.length >= 2) {
      return { min: budget[0], max: budget[1] };
    }

    // Handle object format { min, max }
    if (typeof budget === 'object' && budget.min !== undefined && budget.max !== undefined) {
      return { min: budget.min, max: budget.max };
    }

    console.warn('🎯 DirectNicole: Unable to standardize budget:', budget);
    return null;
  }

  /**
   * **PHASE 4: Experience-to-Product Translation**
   */
  private translateExperiencesToProducts(query: string, interests: string[] = []): string {
    const experienceMap: Record<string, string[]> = {
      'concerts': ['band merch', 'music accessories', 'headphones', 'vinyl records', 'concert gear'],
      'movies': ['blu-ray', 'movie merchandise', 'popcorn makers', 'home theater', 'collectibles'],
      'travel': ['luggage', 'travel accessories', 'maps', 'travel guides', 'portable chargers'],
      'cooking': ['kitchen tools', 'cookbooks', 'spices', 'appliances', 'utensils'],
      'sports': ['sports equipment', 'team merchandise', 'fitness gear', 'sports apparel'],
      'gaming': ['gaming accessories', 'controllers', 'headsets', 'game merchandise'],
      'netflix': ['streaming devices', 'cozy blankets', 'snacks', 'home entertainment']
    };

    let enhancedQuery = query;

    interests.forEach(interest => {
      const lowerInterest = interest.toLowerCase();
      if (experienceMap[lowerInterest]) {
        enhancedQuery += ` ${experienceMap[lowerInterest].join(' ')}`;
      }
    });

    console.log(`🎯 DirectNicole: Translated "${query}" → "${enhancedQuery}"`);
    return enhancedQuery;
  }

  /**
   * **PHASE 5: Interest Relevance Validation**
   */
  private validateProductRelevance(products: any[], nicoleContext: any): Product[] {
    if (!nicoleContext.interests?.length) {
      return products; // No interests to validate against
    }

    const relevantProducts = products.filter(product => {
      const titleLower = product.title?.toLowerCase() || '';
      const descLower = product.description?.toLowerCase() || '';
      
      return nicoleContext.interests.some((interest: string) => 
        titleLower.includes(interest.toLowerCase()) ||
        descLower.includes(interest.toLowerCase())
      );
    });

    console.log(`🎯 DirectNicole: Interest filtering: ${products.length} → ${relevantProducts.length} relevant products`);
    
    // Return relevant products, but fall back to all if none match
    return relevantProducts.length > 0 ? relevantProducts : products;
  }

  /**
   * **PHASE 6: Smart Fallback Logic**
   */
  private async handleSmartFallback(originalQuery: string, nicoleContext: any): Promise<Product[]> {
    console.log('🎯 DirectNicole: Executing smart fallback');

    // Build fallback query with interests
    const fallbackQueries = [
      // First try: best selling + interests
      `best selling ${nicoleContext.interests?.join(' ') || 'gifts'}`,
      // Second try: popular gifts within budget
      nicoleContext.budget ? `popular gifts under $${nicoleContext.budget.max || nicoleContext.budget[1]}` : 'popular gifts',
      // Third try: generic best sellers
      'best selling gifts'
    ];

    for (const fallbackQuery of fallbackQueries) {
      try {
        const { data } = await supabase.functions.invoke('zinc-search', {
          body: {
            query: fallbackQuery,
            maxResults: 16,
            nicoleContext,
            minPrice: nicoleContext.budget?.min || nicoleContext.budget?.[0],
            maxPrice: nicoleContext.budget?.max || nicoleContext.budget?.[1]
          }
        });

        if (data?.results?.length > 0) {
          console.log(`🎯 DirectNicole: Fallback "${fallbackQuery}" found ${data.results.length} products`);
          return data.results;
        }
      } catch (error) {
        console.error(`🎯 DirectNicole: Fallback "${fallbackQuery}" failed:`, error);
      }
    }

    console.warn('🎯 DirectNicole: All fallback attempts failed');
    return [];
  }

  /**
   * **PHASE 7: Context Persistence**
   */
  storeNicoleContext(context: any): void {
    try {
      sessionStorage.setItem('nicoleContext', JSON.stringify({
        ...context,
        timestamp: Date.now(),
        source: 'direct-nicole-service'
      }));
      console.log('🎯 DirectNicole: Context stored in session');
    } catch (error) {
      console.error('🎯 DirectNicole: Failed to store context:', error);
    }
  }

  /**
   * **PHASE 7: Context Retrieval**
   */
  retrieveNicoleContext(): any | null {
    try {
      const stored = sessionStorage.getItem('nicoleContext');
      if (stored) {
        const context = JSON.parse(stored);
        // Check if context is recent (within 1 hour)
        const isRecent = Date.now() - context.timestamp < 3600000;
        if (isRecent) {
          console.log('🎯 DirectNicole: Retrieved stored context');
          return context;
        } else {
          console.log('🎯 DirectNicole: Stored context expired');
          sessionStorage.removeItem('nicoleContext');
        }
      }
    } catch (error) {
      console.error('🎯 DirectNicole: Failed to retrieve context:', error);
    }
    return null;
  }
}

export const directNicoleMarketplaceService = DirectNicoleMarketplaceService.getInstance();