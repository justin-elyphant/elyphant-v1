
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
   * Map interest keywords to diverse Amazon-friendly categories for gift variety
   */
  private mapInterestsToCategories(interests: string[]): string[] {
    const interestMap: Record<string, string[]> = {
      // Entertainment & Media - Multiple category mappings for diversity
      'concerts': ['music', 'fashion accessories', 'tech gadgets', 'electronics'],
      'music': ['music', 'electronics tech', 'headphones audio'],
      'netflix': ['entertainment', 'home comfort', 'snacks food'],
      'streaming': ['entertainment', 'electronics tech'],
      'movies': ['entertainment', 'home theater', 'collectibles'],
      'gaming': ['gaming tech', 'electronics', 'accessories'],
      'games': ['gaming tech', 'electronics', 'collectibles'],
      'books': ['books', 'reading accessories', 'home decor'],
      'reading': ['books', 'reading accessories', 'lighting'],
      
      // Hobbies & Activities - Comprehensive mappings
      'cooking': ['kitchen cooking', 'appliances', 'food specialty', 'books'],
      'kitchen': ['kitchen cooking', 'appliances', 'organization'],
      'baking': ['kitchen cooking', 'appliances', 'books'],
      'fitness': ['fitness gear', 'apparel', 'nutrition', 'tech'],
      'workout': ['fitness gear', 'apparel', 'accessories'],
      'yoga': ['fitness gear', 'apparel', 'wellness'],
      'sports': ['sports equipment', 'apparel', 'accessories'],
      'travel': ['travel accessories', 'luggage', 'electronics', 'books'],
      'photography': ['cameras tech', 'accessories', 'storage'],
      'art': ['arts crafts', 'supplies', 'books'],
      'crafts': ['arts crafts', 'supplies', 'storage'],
      'gardening': ['garden tools', 'plants', 'books'],
      
      // Technology
      'tech': ['electronics tech', 'accessories', 'gadgets'],
      'electronics': ['electronics tech', 'accessories'],
      'phone': ['electronics tech', 'accessories'],
      'computer': ['electronics tech', 'accessories', 'software'],
      'laptop': ['electronics tech', 'accessories'],
      
      // Fashion & Beauty
      'fashion': ['fashion clothing', 'accessories', 'jewelry'],
      'beauty': ['beauty skincare', 'makeup', 'accessories'],
      'skincare': ['beauty skincare', 'wellness'],
      'jewelry': ['jewelry accessories', 'fashion'],
      'accessories': ['jewelry accessories', 'fashion'],
      
      // Home & Living
      'home': ['home decor', 'furniture', 'organization'],
      'decor': ['home decor', 'art', 'lighting'],
      'organization': ['home organization', 'storage'],
      
      // Pets & Animals
      'pets': ['pet supplies', 'toys', 'food'],
      'dog': ['pet supplies', 'toys', 'accessories'],
      'cat': ['pet supplies', 'toys', 'accessories'],
      
      // General categories
      'luxury': ['luxury items', 'jewelry', 'fashion'],
      'premium': ['luxury items', 'electronics', 'fashion']
    };

    const categories = new Set<string>();
    
    interests.forEach(interest => {
      const mapped = interestMap[interest];
      if (mapped && Array.isArray(mapped)) {
        // Add all mapped categories for diversity
        mapped.forEach(category => categories.add(category));
      } else if (typeof mapped === 'string') {
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
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, maxResults = 20, minPrice, maxPrice, nicoleContext } = options;
    
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
        
        // Enhanced diverse search strategy for Nicole context
        if (nicoleContext && nicoleContext.interests && nicoleContext.interests.length > 0) {
          console.log(`[UnifiedMarketplaceService] Nicole context detected with interests: ${nicoleContext.interests.join(', ')}`);
          
          // Map interests to diverse categories
          const categories = this.mapInterestsToCategories(nicoleContext.interests);
          console.log(`[UnifiedMarketplaceService] Mapped to diverse categories: ${categories.join(', ')}`);
          
          if (categories.length > 0) {
            this.showToast('Finding diverse gift options...', 'loading', `Searching across ${categories.length} categories`);
            response = await enhancedZincApiService.searchBestSellingByInterests(categories, maxResults, searchOptions);
          }
        }
        
        // Fallback for standard search with no results
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
