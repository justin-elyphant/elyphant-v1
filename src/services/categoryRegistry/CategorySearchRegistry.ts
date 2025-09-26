/**
 * Phase 1: Consolidated Category Search Registry
 * 
 * This registry centralizes all category search logic and strategies while maintaining
 * all existing protective measures including caching, error handling, and fallbacks.
 * 
 * The registry maps categories to search strategies and routes them to appropriate
 * edge functions, acting as a thin abstraction layer over the existing system.
 */

import { enhancedZincApiService } from "../enhancedZincApiService";

export interface CategorySearchOptions {
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  maxResults?: number;
  priceRange?: { min: number; max: number };
  silent?: boolean;
}

export interface CategorySearchStrategy {
  searchMethod: string;
  edgeFunction?: string;
  fallbackQuery?: string;
  description: string;
  isActive: boolean;
}

export type CategoryKey = 
  | 'best-selling'
  | 'electronics' 
  | 'luxury'
  | 'gifts-for-her'
  | 'gifts-for-him'
  | 'gifts-under-50'
  | 'brand-categories'
  | 'on-the-go'
  | 'movie-buff'
  | 'work-from-home'
  | 'the-traveler'
  | 'the-home-chef'
  | 'teens'
  | 'valentines-day'
  | 'birthdays'
  | 'graduation'
  | 'baby-shower'
  | 'anniversaries'
  | 'mothers-day'
  | 'fathers-day'
  | 'christmas'
  // New categories from UNIVERSAL_CATEGORIES
  | 'flowers'
  | 'fashion'
  | 'pets'
  | 'home'
  | 'beauty'
  | 'sports'
  | 'athleisure'
  | 'books'
  | 'toys'
  | 'food'
  | 'arts'
  | 'health'
  | 'baby'
  | 'jewelry'
  | 'kitchen'
  | 'tech'
  | 'music'
  | 'gaming'
  | 'wedding'
  | 'gifts'
  | 'bags-purses'
  | 'default';

/**
 * Central registry mapping categories to their search strategies
 * This maintains backward compatibility while enabling future consolidation
 */
export const CATEGORY_SEARCH_REGISTRY: Record<CategoryKey, CategorySearchStrategy> = {
  'best-selling': {
    searchMethod: 'searchBestSellingCategories',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling top rated popular trending most bought bestseller',
    description: 'Best selling products across multiple categories with diversity',
    isActive: true
  },
  'electronics': {
    searchMethod: 'searchElectronicsCategories', 
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling electronics phones computers laptops headphones cameras',
    description: 'Electronics products with beauty product filtering',
    isActive: true
  },
  'luxury': {
    searchMethod: 'searchLuxuryCategories',
    edgeFunction: 'get-products', 
    fallbackQuery: 'luxury designer premium high-end',
    description: 'Premium luxury products from designer brands',
    isActive: true
  },
  'gifts-for-her': {
    searchMethod: 'searchGiftsForHerCategories',
    edgeFunction: 'get-products',
    fallbackQuery: 'skincare essentials for women',
    description: 'Curated gift categories specifically for women',
    isActive: true
  },
  'gifts-for-him': {
    searchMethod: 'searchGiftsForHimCategories', 
    edgeFunction: 'get-products',
    fallbackQuery: 'tech gadgets for men',
    description: 'Curated gift categories specifically for men',
    isActive: true
  },
  'gifts-under-50': {
    searchMethod: 'searchGiftsUnder50Categories',
    edgeFunction: 'get-products',
    fallbackQuery: 'affordable tech accessories',
    description: 'Budget-friendly gifts under $50 with price filtering',
    isActive: true
  },
  'brand-categories': {
    searchMethod: 'searchBrandCategories',
    edgeFunction: 'get-products',
    fallbackQuery: '', // Dynamic based on brand name
    description: 'Multi-category brand searches with brand filtering',
    isActive: true
  },
  'on-the-go': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'portable electronics travel accessories convenience gadgets on-the-go essentials commuter gear',
    description: 'Products for busy, active lifestyles',
    isActive: true
  },
  'movie-buff': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'streaming devices home theater popcorn makers entertainment accessories movie collectibles comfort items',
    description: 'Products for cinema lovers and entertainment enthusiasts',
    isActive: true
  },
  'work-from-home': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'office supplies ergonomic furniture productivity tools desk accessories lighting organization',
    description: 'Essentials for productive remote work',
    isActive: true
  },
  'the-traveler': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'travel luggage backpacks cameras portable electronics travel accessories gear organizers comfort items neck pillows',
    description: 'Adventure-ready gear for wanderers',
    isActive: true
  },
  'the-home-chef': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'kitchen appliances cooking gadgets specialty ingredients cookbooks utensils food storage',
    description: 'Culinary tools for kitchen enthusiasts',
    isActive: true
  },
  'teens': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'trendy accessories tech gadgets gaming items room decor study supplies fashion',
    description: 'Trendy picks for young adults',
    isActive: true
  },
  'valentines-day': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling valentines day gifts romantic gifts couples gifts love hearts',
    description: 'Romantic gifts for Valentine\'s Day',
    isActive: true
  },
  'birthdays': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling birthday gifts celebration gifts party supplies personalized gifts',
    description: 'Perfect gifts for birthday celebrations',
    isActive: true
  },
  'graduation': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling graduation gifts achievement gifts professional items milestone gifts',
    description: 'Celebrate academic achievements',
    isActive: true
  },
  'baby-shower': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling baby shower gifts newborn essentials baby clothes toys nursery items',
    description: 'Welcome new arrivals with perfect gifts',
    isActive: true
  },
  'anniversaries': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling anniversary gifts romantic gifts couple gifts milestone celebrations',
    description: 'Commemorate special milestones together',
    isActive: true
  },
  'mothers-day': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling mothers day gifts mom gifts jewelry flowers spa gifts pampering',
    description: 'Honor special moms with thoughtful gifts',
    isActive: true
  },
  'fathers-day': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling fathers day gifts dad gifts tools gadgets sports accessories hobbies',
    description: 'Celebrate dads with meaningful gifts',
    isActive: true
  },
  'christmas': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling christmas gifts holiday gifts festive items seasonal decorations',
    description: 'Spread holiday joy and cheer',
    isActive: true
  },
  // New categories from UNIVERSAL_CATEGORIES
  'flowers': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'fresh flowers bouquet delivery roses tulips sunflowers orchids wedding flowers sympathy arrangements seasonal blooms',
    description: 'Fresh flowers and arrangements',
    isActive: true
  },
  'fashion': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling fashion clothing apparel shoes accessories',
    description: 'Clothing and accessories',
    isActive: true
  },
  'pets': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling pet products dog cat supplies toys treats',
    description: 'Pet supplies and accessories',
    isActive: true
  },
  'home': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'home decor furniture kitchen accessories bedding curtains pillows candles',
    description: 'Decor and household items',
    isActive: true
  },
  'beauty': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'skincare makeup cosmetics beauty products lipstick foundation moisturizer',
    description: 'Skincare and cosmetics',
    isActive: true
  },
  'sports': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling sports equipment nike adidas under armour wilson spalding yeti coleman outdoor gear fitness',
    description: 'Fitness and outdoor gear',
    isActive: true
  },
  'athleisure': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'athletic wear yoga pants leggings activewear nike adidas lululemon under armour alo yoga',
    description: 'Athletic and activewear',
    isActive: true
  },
  'books': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling books',
    description: 'Literature and educational',
    isActive: true
  },
  'toys': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'toys games kids children educational puzzles building blocks dolls action figures',
    description: 'Fun for all ages',
    isActive: true
  },
  'food': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best gourmet food specialty snacks organic coffee tea chocolate wine cheese gift baskets',
    description: 'Gourmet and specialty items',
    isActive: true
  },
  'arts': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'art supplies craft supplies drawing materials paint brushes canvas markers colored pencils craft kits scrapbook paper',
    description: 'Creative supplies and tools',
    isActive: true
  },
  'health': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best wellness products',
    description: 'Wellness and self-care',
    isActive: true
  },
  'baby': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling baby products',
    description: 'Baby care and essentials',
    isActive: true
  },
  'jewelry': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling jewelry',
    description: 'Fine and fashion jewelry',
    isActive: true
  },
  'kitchen': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling kitchen products',
    description: 'Cooking and dining essentials',
    isActive: true
  },
  'tech': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling tech products electronics gadgets smart devices',
    description: 'Technology and gadgets',
    isActive: true
  },
  'music': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling music',
    description: 'Musical instruments and audio',
    isActive: true
  },
  'gaming': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling gaming',
    description: 'Video games and accessories',
    isActive: true
  },
  'wedding': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'wedding gifts bridal party engagement ceremony reception decorations invitations favors',
    description: 'Wedding essentials and gifts',
    isActive: true
  },
  'gifts': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling gifts',
    description: 'Perfect gift ideas',
    isActive: true
  },
  'bags-purses': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'best selling bags purses',
    description: 'Handbags and accessories',
    isActive: true
  },
  'default': {
    searchMethod: 'searchProducts',
    edgeFunction: 'get-products',
    fallbackQuery: 'popular products',
    description: 'Default search through enhanced Zinc API',
    isActive: true
  }
};

/**
 * Category Search Registry - Phase 1 Implementation
 * 
 * This class provides a unified interface for all category searches while
 * preserving existing protective measures and maintaining backward compatibility.
 */
export class CategorySearchRegistry {
  
  /**
   * Get category strategy for a given category key
   */
  static getCategoryStrategy(category: string): CategorySearchStrategy {
    const categoryKey = category as CategoryKey;
    return CATEGORY_SEARCH_REGISTRY[categoryKey] || CATEGORY_SEARCH_REGISTRY.default;
  }

  /**
   * Check if a category has an active search strategy
   */
  static isCategorySupported(category: string): boolean {
    const strategy = this.getCategoryStrategy(category);
    return strategy.isActive;
  }

  /**
   * Get list of all supported categories
   */
  static getSupportedCategories(): CategoryKey[] {
    return Object.keys(CATEGORY_SEARCH_REGISTRY).filter(
      key => CATEGORY_SEARCH_REGISTRY[key as CategoryKey].isActive
    ) as CategoryKey[];
  }

  /**
   * Execute category search with consolidated error handling and fallbacks
   * 
   * This method routes to the appropriate search strategy while maintaining
   * all existing protective measures from the enhancedZincApiService.
   */
  static async executeSearch(
    category: string,
    searchTerm: string = '',
    options: CategorySearchOptions = {}
  ): Promise<any> {
    const strategy = this.getCategoryStrategy(category);
    
    console.log(`[CategorySearchRegistry] Executing search for category: ${category}`, {
      strategy: strategy.searchMethod,
      edgeFunction: strategy.edgeFunction,
      options
    });

    try {
      // Route to appropriate search method with existing protective measures
      switch (category) {
        case 'best-selling':
          return await enhancedZincApiService.searchBestSellingCategories(
            options.limit || 20, 
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        case 'electronics':
          return await enhancedZincApiService.searchElectronicsCategories(
            options.limit || 20,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        case 'luxury':
          return await enhancedZincApiService.searchLuxuryCategories(
            options.limit || 16,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        case 'gifts-for-her':
          return await enhancedZincApiService.searchGiftsForHerCategories(
            options.limit || 16,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        case 'gifts-for-him':
          return await enhancedZincApiService.searchGiftsForHimCategories(
            options.limit || 16,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        case 'gifts-under-50':
          return await enhancedZincApiService.searchGiftsUnder50Categories(
            options.limit || 16,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        case 'brand-categories':
          if (!searchTerm.trim()) {
            throw new Error('Brand name is required for brand category search');
          }
          return await enhancedZincApiService.searchBrandCategories(
            searchTerm,
            options.limit || 20,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );

        // All other categories use the standard searchProducts method with their optimized search terms
        default:
          const searchQuery = searchTerm || strategy.fallbackQuery;
          console.log(`[CategorySearchRegistry] Using searchProducts for category: ${category} with query: "${searchQuery}"`);
          return await enhancedZincApiService.searchProducts(
            searchQuery,
            options.page || 1,
            options.limit || 20,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );
      }

    } catch (error) {
      console.error(`[CategorySearchRegistry] Search failed for category: ${category}`, error);
      
      // Fallback to default search with error recovery
      if (category !== 'default') {
        console.log(`[CategorySearchRegistry] Attempting fallback search for: ${category}`);
        try {
          return await enhancedZincApiService.searchProducts(
            strategy.fallbackQuery || searchTerm || 'popular products',
            1,
            options.limit || 20,
            { minPrice: options.minPrice, maxPrice: options.maxPrice }
          );
        } catch (fallbackError) {
          console.error(`[CategorySearchRegistry] Fallback search also failed:`, fallbackError);
          return {
            results: [],
            error: `Search failed for category: ${category}`
          };
        }
      }

      return {
        results: [],
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get search analytics for category performance monitoring
   * (Preparation for Phase 3: Performance Monitoring)
   */
  static getSearchAnalytics(): Record<string, any> {
    return {
      supportedCategories: this.getSupportedCategories(),
      activeStrategies: Object.entries(CATEGORY_SEARCH_REGISTRY)
        .filter(([_, strategy]) => strategy.isActive)
        .map(([category, strategy]) => ({
          category,
          method: strategy.searchMethod,
          edgeFunction: strategy.edgeFunction
        })),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Legacy compatibility exports to maintain existing functionality
 */
export const getCategorySearchQuery = (category: string): string => {
  const strategy = CategorySearchRegistry.getCategoryStrategy(category);
  return strategy.fallbackQuery || category;
};

export const isCategorySupported = (category: string): boolean => {
  return CategorySearchRegistry.isCategorySupported(category);
};