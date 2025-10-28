
import { Product } from "@/types/product";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { normalizeProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { extractBudgetFromNicoleContext, logPriceRangeDebug, validateResultsPriceRange } from "./nicoleContextUtils";

export interface SearchOptions {
  maxResults?: number;
  page?: number;
  filters?: any;
  luxuryCategories?: boolean;
  giftsForHer?: boolean;
  giftsForHim?: boolean;
  giftsUnder50?: boolean;
  bestSelling?: boolean;
  electronics?: boolean;
  brandCategories?: boolean;
  personId?: string;
  occasionType?: string;
  nicoleContext?: any;
  minPrice?: number;
  maxPrice?: number;
  silent?: boolean; // Prevent toasts for background searches
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
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, bestSelling = false, electronics = false, brandCategories = false, page = 1, maxResults = 20, minPrice, maxPrice } = options;
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

    // Note: Sonner automatically handles loading toast dismissal on success/error

    if (type === 'loading') {
      return toast.loading(message, { description });
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
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, maxResults = 20, page = 1, nicoleContext, silent = false } = options;
    
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
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, maxResults = 20, minPrice, maxPrice, nicoleContext, filters, silent = false } = options;
    
    try {
      let response;
      
      // Create search options with price filters (map to expected edge function format)
      // Merge any provided filters with price parameters
      const searchOptions = { 
        minPrice, 
        maxPrice,
        min_price: minPrice,  // Edge function expects this format
        max_price: maxPrice,   // Edge function expects this format
        ...filters  // Include any additional filters passed from searchOperations
      };
      
      console.log('🎯 UnifiedMarketplaceService: Final search options with price filters:', searchOptions);
      
      if (luxuryCategories) {
        console.log('[UnifiedMarketplaceService] Executing luxury category search');
        if (!silent) {
          this.showToast('Loading luxury collections...', 'loading', 'Searching premium brands and designers');
        }
        response = await enhancedZincApiService.searchLuxuryCategories(maxResults, searchOptions);
      } else if (giftsForHer) {
        console.log('[UnifiedMarketplaceService] Executing gifts for her category search');
        if (!silent) {
          this.showToast('Loading gifts for her...', 'loading', 'Finding thoughtful gifts she\'ll love');
        }
        response = await enhancedZincApiService.searchGiftsForHerCategories(maxResults, searchOptions);
      } else if (giftsForHim) {
        console.log('[UnifiedMarketplaceService] Executing gifts for him category search');
        if (!silent) {
          this.showToast('Loading gifts for him...', 'loading', 'Finding perfect gifts for him');
        }
        response = await enhancedZincApiService.searchGiftsForHimCategories(maxResults, searchOptions);
      } else if (giftsUnder50) {
        console.log('[UnifiedMarketplaceService] Executing gifts under $50 category search');
        if (!silent) {
          this.showToast('Loading gifts under $50...', 'loading', 'Finding affordable gift options');
        }
        response = await enhancedZincApiService.searchGiftsUnder50Categories(maxResults, searchOptions);
      } else if (options.bestSelling) {
        console.log('[UnifiedMarketplaceService] Executing best selling category search');
        if (!silent) {
          // No toast needed to keep UI clean
        }
        response = await enhancedZincApiService.searchBestSellingCategories(maxResults, searchOptions);
      } else if (options.electronics) {
        console.log('[UnifiedMarketplaceService] Executing electronics category search');
        if (!silent) {
          // No toast needed to keep UI clean
        }
        response = await enhancedZincApiService.searchElectronicsCategories(maxResults, searchOptions);
        
        // Filter out beauty products that might slip through (maintaining existing protection)
        if (response && Array.isArray(response)) {
          const originalCount = response.length;
          response = response.filter(product => {
            const title = product.title?.toLowerCase() || '';
            const description = product.description?.toLowerCase() || '';
            const category = product.category?.toLowerCase() || '';
            
            // Exclude beauty/skincare products
            const isBeautyProduct = title.includes('serum') || title.includes('cleanser') || 
                                  title.includes('beauty') || title.includes('skincare') ||
                                  title.includes('moisturizer') || title.includes('lotion') ||
                                  title.includes('spf') || title.includes('sunscreen') ||
                                  category.includes('beauty') || category.includes('skincare');
            
            return !isBeautyProduct;
          });
          
          console.log(`📱 Filtered electronics products: ${response.length} (removed ${originalCount - response.length} beauty products)`);
        }
      } else if (brandCategories && searchTerm.trim()) {
        console.log(`[UnifiedMarketplaceService] Executing brand category search for: ${searchTerm}`);
        if (!silent) {
          // Silently execute brand category search - no toast needed
        }
        response = await enhancedZincApiService.searchBrandCategories(searchTerm, maxResults, searchOptions);
      } else if (searchTerm.trim()) {
        console.log(`[UnifiedMarketplaceService] Executing standard search: "${searchTerm}" with price range: ${minPrice || 'any'}-${maxPrice || 'any'} and filters:`, searchOptions);
        // Removed toast notification to prevent "searching for" tokens from appearing during automatic searches
        response = await enhancedZincApiService.searchProducts(searchTerm, 1, maxResults, searchOptions);
        
        // Enhanced diverse search strategy for Nicole context
        if (nicoleContext && nicoleContext.interests && nicoleContext.interests.length > 0) {
          console.log(`[UnifiedMarketplaceService] Nicole context detected with interests: ${nicoleContext.interests.join(', ')}`);
          
          // Map interests to diverse categories
          const categories = this.mapInterestsToCategories(nicoleContext.interests);
          console.log(`[UnifiedMarketplaceService] Mapped to diverse categories: ${categories.join(', ')}`);
          
          if (categories.length > 0) {
            let toastId;
            if (!silent) {
              toastId = this.showToast('Finding diverse gift options...', 'loading', `Searching across ${categories.length} categories`);
            }
            response = await enhancedZincApiService.searchBestSellingByInterests(categories, maxResults, searchOptions);
            if (toastId) {
              toast.dismiss(toastId);
            }
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
            
            let toastId;
            if (!silent) {
              toastId = this.showToast('Finding diverse gift options...', 'loading', `Searching ${categories.join(', ')} categories`);
            }
            response = await enhancedZincApiService.searchBestSellingByInterests(categories, maxResults, searchOptions);
            if (toastId) {
              toast.dismiss(toastId);
            }
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
      
      // Enforce client-side budget filtering as a safety net
      let finalProducts = normalizedProducts;
      if (typeof minPrice !== 'undefined' || typeof maxPrice !== 'undefined') {
        const { validProducts, invalidProducts } = validateResultsPriceRange(normalizedProducts, {
          minPrice,
          maxPrice,
        });
        if (invalidProducts.length > 0) {
          console.log('[UnifiedMarketplaceService] Client-side price filter removed', invalidProducts.length, 'items outside range', { minPrice, maxPrice });
        }
        finalProducts = validProducts;
      }
      
      if (finalProducts.length > 0) {
        const successMessage = luxuryCategories 
          ? `Found ${finalProducts.length} luxury items`
          : giftsForHer
            ? `Found ${finalProducts.length} gifts for her`
            : giftsForHim
              ? `Found ${finalProducts.length} gifts for him`
              : giftsUnder50
                ? `Found ${finalProducts.length} gifts under $50`
                : brandCategories
                  ? `Found ${finalProducts.length} ${searchTerm} products`
                  : searchTerm 
                    ? `Found ${finalProducts.length} results`
                    : `Loaded ${finalProducts.length} featured products`;
            
        // Only show toasts if not silent
        if (!silent) {
          console.log(`UnifiedMarketplaceService: ${successMessage}`);
        }
      } else {
        const noResultsMessage = searchTerm 
          ? `No results found for "${searchTerm}"`
          : 'No products available';
          
        // Only show error toasts if not silent
        if (!silent) {
          this.showToast(noResultsMessage, 'error');
        } else {
          console.log(`UnifiedMarketplaceService: ${noResultsMessage}`);
        }
      }

      return finalProducts;
      
    } catch (error) {
      console.error('[UnifiedMarketplaceService] Search error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      this.showToast('Search failed', 'error', errorMessage);
      
      // Clear cache on error to force fresh data next time
      this.cache.clear();
      
      // Live "best selling" fallback with price range instead of mock products
      if (searchTerm.trim()) {
        console.log('[UnifiedMarketplaceService] API failed, falling back to live "best selling" search with budget constraints');
        return this.executeliveBestSellingFallback(searchTerm, options);
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
    console.log('[UnifiedMarketplaceService] Cache cleared - fresh data will be fetched on next search');
  }

  /**
   * Execute live "best selling" fallback with price range filtering
   */
  private async executeliveBestSellingFallback(searchTerm: string, options: SearchOptions): Promise<Product[]> {
    const { maxResults = 20, minPrice, maxPrice, nicoleContext, silent = false } = options;
    
    console.log(`[UnifiedMarketplaceService] Executing live "best selling" fallback for "${searchTerm}" with price range: ${minPrice || 'any'}-${maxPrice || 'any'}`);
    
    try {
      // Create search options with price filters
      const searchOptions = { minPrice, maxPrice };
      
      // Build a "best selling" query that includes the price range and original interests
      let fallbackQuery = 'best selling';
      
      // Add price range to query if specified
      if (minPrice && maxPrice) {
        fallbackQuery += ` $${minPrice}-$${maxPrice}`;
      } else if (maxPrice) {
        fallbackQuery += ` under $${maxPrice}`;
      } else if (minPrice) {
        fallbackQuery += ` over $${minPrice}`;
      }
      
      // Extract interests for diverse fallback search
      const interests = this.extractInterestKeywords(searchTerm);
      const categories = this.mapInterestsToCategories(interests);
      
      if (!silent) {
        this.showToast('Finding popular alternatives...', 'loading', `Searching best selling items within budget`);
      }
      
      let response;
      
      // Use diverse category search if we have interests, otherwise use basic best selling
      if (categories.length > 0) {
        console.log(`[UnifiedMarketplaceService] Live fallback using diverse categories: ${categories.join(', ')}`);
        response = await enhancedZincApiService.searchBestSellingByInterests(categories, maxResults, searchOptions);
      } else {
        console.log(`[UnifiedMarketplaceService] Live fallback using basic best selling search: "${fallbackQuery}"`);
        response = await enhancedZincApiService.searchProducts(fallbackQuery, 1, maxResults, searchOptions);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Normalize and validate products
      const normalizedProducts = normalizeProducts(response.results || []);
      
      // Apply client-side budget filtering here as well
      let finalProducts = normalizedProducts;
      if (typeof minPrice !== 'undefined' || typeof maxPrice !== 'undefined') {
        const { validProducts, invalidProducts } = validateResultsPriceRange(normalizedProducts, { minPrice, maxPrice });
        if (invalidProducts.length > 0) {
          console.log('[UnifiedMarketplaceService] Fallback: removed', invalidProducts.length, 'items outside range', { minPrice, maxPrice });
        }
        finalProducts = validProducts;
      }
      
      if (finalProducts.length > 0) {
        this.showToast(`Found ${finalProducts.length} popular alternatives`, 'success', 'Showing best selling items within your budget');
        console.log(`[UnifiedMarketplaceService] Live fallback successful: ${finalProducts.length} products returned`);
      } else {
        this.showToast('No alternatives found', 'error', 'No popular items found within budget');
        console.log('[UnifiedMarketplaceService] Live fallback returned no results');
      }
      
      return finalProducts;
      
    } catch (fallbackError) {
      console.error('[UnifiedMarketplaceService] Live fallback also failed:', fallbackError);
      this.showToast('Search unavailable', 'error', 'Product search service is temporarily unavailable');
      return [];
    }
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

// Clear cache on service initialization to ensure fresh data
unifiedMarketplaceService.clearCache();
