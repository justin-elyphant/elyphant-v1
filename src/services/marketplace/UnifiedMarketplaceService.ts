
import { Product } from "@/types/product";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { normalizeProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { extractBudgetFromNicoleContext, logPriceRangeDebug } from "./nicoleContextUtils";

export interface SearchOptions {
  maxResults?: number;
  page?: number;
  filters?: any;
  luxuryCategories?: boolean;
  giftsForHer?: boolean;
  giftsForHim?: boolean;
  giftsUnder50?: boolean;
  brandCategories?: boolean;
  personId?: string;
  occasionType?: string;
  // Price range filtering from Nicole AI budget context
  minPrice?: number;
  maxPrice?: number;
  // Nicole AI context for enhanced filtering
  nicoleContext?: any;
}

export interface MarketplaceState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  lastSearchId: string;
  hasMore: boolean;
  totalCount: number;
}

class UnifiedMarketplaceService {
  private cache = new Map<string, { data: Product[]; timestamp: number; ttl: number }>();
  private activeRequests = new Map<string, Promise<Product[]>>();
  private toastHistory = new Set<string>();
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TOAST_COOLDOWN = 3000; // 3 seconds between same toasts

  /**
   * Generate cache key for search operations
   */
  private getCacheKey(searchTerm: string, options: SearchOptions = {}): string {
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, page = 1, maxResults = 20, minPrice, maxPrice } = options;
    // Add version suffix to force cache refresh for updated categories
    const version = giftsUnder50 ? 'v7' : brandCategories ? 'v1' : 'v1';
    const priceKey = minPrice || maxPrice ? `:price:${minPrice || 0}-${maxPrice || 9999}` : '';
    return `search:${searchTerm}:luxury:${luxuryCategories}:giftsForHer:${giftsForHer}:giftsForHim:${giftsForHim}:giftsUnder50:${giftsUnder50}:brandCategories:${brandCategories}:page:${page}:limit:${maxResults}${priceKey}:${version}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  /**
   * Show toast with deduplication
   */
  private showToast(message: string, type: 'success' | 'error' | 'loading' = 'success', description?: string) {
    const toastKey = `${type}:${message}`;
    const now = Date.now();
    
    // Check if we've shown this toast recently
    if (this.toastHistory.has(toastKey)) return;
    
    this.toastHistory.add(toastKey);
    
    // Remove from history after cooldown
    setTimeout(() => {
      this.toastHistory.delete(toastKey);
    }, this.TOAST_COOLDOWN);

    if (type === 'loading') {
      toast.loading(message, { description });
    } else if (type === 'error') {
      toast.error(message, { description });
    } else {
      toast.success(message, { description });
    }
  }


  /**
   * Search products with unified caching and deduplication
   */
  async searchProducts(searchTerm: string, options: SearchOptions = {}): Promise<Product[]> {
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, maxResults = 20, page = 1, nicoleContext } = options;
    
    // Extract budget from Nicole context if provided
    const budgetFromContext = extractBudgetFromNicoleContext(nicoleContext);
    const finalOptions = {
      ...options,
      minPrice: options.minPrice || budgetFromContext.minPrice,
      maxPrice: options.maxPrice || budgetFromContext.maxPrice
    };
    
    // Log debugging info for price range
    logPriceRangeDebug(searchTerm, nicoleContext, budgetFromContext);
    const cacheKey = this.getCacheKey(searchTerm, finalOptions);
    
    console.log(`[UnifiedMarketplaceService] Searching: "${searchTerm}", luxury: ${luxuryCategories}, giftsForHer: ${giftsForHer}, giftsForHim: ${giftsForHim}, giftsUnder50: ${giftsUnder50}, brandCategories: ${brandCategories}, priceRange: ${finalOptions.minPrice}-${finalOptions.maxPrice}`);
    console.log(`[UnifiedMarketplaceService] Cache key: ${cacheKey}`);
    
    // FORCE bypass cache for gifts under $50 until it works
    if (giftsUnder50) {
      console.log('[UnifiedMarketplaceService] Force bypassing cache for gifts under $50');
      const requestPromise = this.executeSearch(searchTerm, finalOptions);
      try {
        const results = await requestPromise;
        // Cache the results
        this.cache.set(cacheKey, {
          data: results,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        });
        return results;
      } catch (error) {
        console.error('[UnifiedMarketplaceService] Search error:', error);
        throw error;
      }
    }
    
    // Check cache first for other searches
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log(`[UnifiedMarketplaceService] Cache hit for: ${cacheKey}`);
      return cached.data;
    }

    // Check if same request is already in progress
    if (this.activeRequests.has(cacheKey)) {
      console.log(`[UnifiedMarketplaceService] Request already in progress: ${cacheKey}`);
      return this.activeRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.executeSearch(searchTerm, finalOptions);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const results = await requestPromise;
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      });
      
      return results;
    } finally {
      // Always remove from active requests
      this.activeRequests.delete(cacheKey);
    }
  }

  /**
   * Extract interest keywords from search term with improved parsing
   */
  private extractInterestKeywords(searchTerm: string): string[] {
    const keywords = searchTerm.toLowerCase()
      .split(/\s+|[,&+]/) // Split on spaces, commas, ampersands, plus signs
      .map(word => word.trim())
      .filter(word => word.length > 2 && !['gift', 'gifts', 'for', 'and', 'the', 'with', 'from', 'best', 'top'].includes(word));
    
    console.log(`[UnifiedMarketplaceService] Extracted keywords from "${searchTerm}": ${keywords.join(', ')}`);
    return keywords;
  }

  /**
   * Map interest keywords to Amazon-friendly best selling categories
   */
  private mapInterestsToCategories(interests: string[]): string[] {
    const interestMap: Record<string, string> = {
      // Entertainment & Media
      'concerts': 'music',
      'music': 'music',
      'netflix': 'entertainment',
      'streaming': 'entertainment',
      'movies': 'entertainment',
      'gaming': 'gaming tech',
      'games': 'gaming tech',
      'books': 'books',
      'reading': 'books',
      
      // Hobbies & Activities
      'cooking': 'kitchen cooking',
      'kitchen': 'kitchen cooking',
      'baking': 'kitchen cooking',
      'fitness': 'fitness gear',
      'workout': 'fitness gear',
      'yoga': 'fitness gear',
      'sports': 'sports equipment',
      'travel': 'travel accessories',
      'photography': 'cameras tech',
      'art': 'arts crafts',
      'crafts': 'arts crafts',
      'gardening': 'garden tools',
      
      // Technology
      'tech': 'electronics tech',
      'electronics': 'electronics tech',
      'phone': 'electronics tech',
      'computer': 'electronics tech',
      'laptop': 'electronics tech',
      
      // Fashion & Beauty
      'fashion': 'fashion clothing',
      'beauty': 'beauty skincare',
      'skincare': 'beauty skincare',
      'jewelry': 'jewelry accessories',
      'accessories': 'jewelry accessories',
      
      // Home & Living
      'home': 'home decor',
      'decor': 'home decor',
      'organization': 'home organization',
      
      // Pets & Animals
      'pets': 'pet supplies',
      'dog': 'pet supplies',
      'cat': 'pet supplies',
      
      // General categories
      'luxury': 'luxury items',
      'premium': 'luxury items'
    };

    const categories = new Set<string>();
    
    interests.forEach(interest => {
      const mapped = interestMap[interest];
      if (mapped) {
        categories.add(mapped);
      }
    });

    // If no specific mappings found, add generic categories
    if (categories.size === 0) {
      categories.add('popular gifts');
    }

    return Array.from(categories);
  }

  /**
   * Execute the actual search operation
   */
  private async executeSearch(searchTerm: string, options: SearchOptions): Promise<Product[]> {
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, maxResults = 20, minPrice, maxPrice } = options;
    
    try {
      let response;
      
      // Create search options with price filters
      const searchOptions = { minPrice, maxPrice };
      
      if (luxuryCategories) {
        console.log('[UnifiedMarketplaceService] Executing luxury category search');
        this.showToast('Loading luxury collections...', 'loading', 'Searching premium brands and designers');
        response = await enhancedZincApiService.searchLuxuryCategories(maxResults, searchOptions);
      } else if (giftsForHer) {
        console.log('[UnifiedMarketplaceService] Executing gifts for her category search');
        this.showToast('Loading gifts for her...', 'loading', 'Finding thoughtful gifts she\'ll love');
        response = await enhancedZincApiService.searchGiftsForHerCategories(maxResults, searchOptions);
      } else if (giftsForHim) {
        console.log('[UnifiedMarketplaceService] Executing gifts for him category search');
        this.showToast('Loading gifts for him...', 'loading', 'Finding perfect gifts for him');
        response = await enhancedZincApiService.searchGiftsForHimCategories(maxResults, searchOptions);
      } else if (giftsUnder50) {
        console.log('[UnifiedMarketplaceService] Executing gifts under $50 category search');
        this.showToast('Loading gifts under $50...', 'loading', 'Finding affordable gift options');
        response = await enhancedZincApiService.searchGiftsUnder50Categories(maxResults, searchOptions);
      } else if (brandCategories && searchTerm.trim()) {
        console.log(`[UnifiedMarketplaceService] Executing brand category search for: ${searchTerm}`);
        this.showToast(`Loading ${searchTerm} products...`, 'loading', `Finding ${searchTerm} products across categories`);
        response = await enhancedZincApiService.searchBrandCategories(searchTerm, maxResults, searchOptions);
      } else if (searchTerm.trim()) {
        console.log(`[UnifiedMarketplaceService] Executing standard search: "${searchTerm}" with price range: ${minPrice || 'any'}-${maxPrice || 'any'}`);
        this.showToast(`Searching for "${searchTerm}"...`, 'loading');
        response = await enhancedZincApiService.searchProducts(searchTerm, 1, maxResults, searchOptions);
        
        // If no results found, try best selling fallback based on interests
        if (!response.error && (!response.results || response.results.length === 0)) {
          console.log(`[UnifiedMarketplaceService] No results for "${searchTerm}", trying best selling fallback`);
          
          const interests = this.extractInterestKeywords(searchTerm);
          const categories = this.mapInterestsToCategories(interests);
          
          if (categories.length > 0) {
            console.log(`[UnifiedMarketplaceService] Extracted interests: ${interests.join(', ')}`);
            console.log(`[UnifiedMarketplaceService] Mapped categories: ${categories.join(', ')}`);
            
            this.showToast('Finding diverse gift options...', 'loading', `Searching ${categories.join(', ')} categories`);
            response = await enhancedZincApiService.searchBestSellingByInterests(categories, maxResults, searchOptions);
          }
        }
      } else {
        console.log('[UnifiedMarketplaceService] Loading default products');
        response = await enhancedZincApiService.getDefaultProducts(maxResults, searchOptions);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Normalize and validate products
      const normalizedProducts = normalizeProducts(response.results || []);
      
      if (normalizedProducts.length > 0) {
        const successMessage = luxuryCategories 
          ? `Found ${normalizedProducts.length} luxury items`
          : giftsForHer
            ? `Found ${normalizedProducts.length} gifts for her`
            : giftsForHim
              ? `Found ${normalizedProducts.length} gifts for him`
              : giftsUnder50
                ? `Found ${normalizedProducts.length} gifts under $50`
                : brandCategories
                  ? `Found ${normalizedProducts.length} ${searchTerm} products`
                  : searchTerm 
                    ? `Found ${normalizedProducts.length} results`
                    : `Loaded ${normalizedProducts.length} featured products`;
            
        this.showToast(successMessage, 'success');
      } else {
        const noResultsMessage = searchTerm 
          ? `No results found for "${searchTerm}"`
          : 'No products available';
          
        this.showToast(noResultsMessage, 'error');
      }

      return normalizedProducts;
      
    } catch (error) {
      console.error('[UnifiedMarketplaceService] Search error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      this.showToast('Search failed', 'error', errorMessage);
      
      // Clear cache on error to force fresh data next time
      this.cache.clear();
      
      // Fallback to mock products for development
      if (searchTerm.trim()) {
        console.log('[UnifiedMarketplaceService] Falling back to mock products');
        return searchMockProducts(searchTerm, maxResults);
      }
      
      return [];
    }
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    const cacheKey = `product:${productId}`;
    
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached.data[0] || null;
    }

    try {
      const productData = await enhancedZincApiService.getProductDetails(productId);
      const normalizedProduct = normalizeProducts([productData])[0] || null;
      
      if (normalizedProduct) {
        this.cache.set(cacheKey, {
          data: [normalizedProduct],
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        });
      }
      
      return normalizedProduct;
    } catch (error) {
      console.error('[UnifiedMarketplaceService] Product details error:', error);
      return null;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.activeRequests.clear();
    this.toastHistory.clear();
    console.log('[UnifiedMarketplaceService] Cache cleared - forcing page reload');
    // Force reload to clear all cached data
    setTimeout(() => window.location.reload(), 100);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      toastHistory: this.toastHistory.size
    };
  }
}

// Export singleton instance
export const unifiedMarketplaceService = new UnifiedMarketplaceService();
