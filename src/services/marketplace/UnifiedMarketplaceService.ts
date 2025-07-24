
import { Product } from "@/types/product";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { normalizeProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

export interface SearchOptions {
  maxResults?: number;
  page?: number;
  filters?: any;
  luxuryCategories?: boolean;
  giftsForHer?: boolean;
  giftsForHim?: boolean;
  giftsUnder50?: boolean;
  personId?: string;
  occasionType?: string;
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
    const { luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, page = 1, maxResults = 20 } = options;
    return `search:${searchTerm}:luxury:${luxuryCategories}:giftsForHer:${giftsForHer}:giftsForHim:${giftsForHim}:giftsUnder50:${giftsUnder50}:page:${page}:limit:${maxResults}`;
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
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, maxResults = 20, page = 1 } = options;
    const cacheKey = this.getCacheKey(searchTerm, options);
    
    console.log(`[UnifiedMarketplaceService] Searching: "${searchTerm}", luxury: ${luxuryCategories}, giftsForHer: ${giftsForHer}, giftsForHim: ${giftsForHim}, giftsUnder50: ${giftsUnder50}`);
    
    // Check cache first
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
    const requestPromise = this.executeSearch(searchTerm, options);
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
   * Execute the actual search operation
   */
  private async executeSearch(searchTerm: string, options: SearchOptions): Promise<Product[]> {
    const { luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, maxResults = 20 } = options;
    
    try {
      let response;
      
      if (luxuryCategories) {
        console.log('[UnifiedMarketplaceService] Executing luxury category search');
        this.showToast('Loading luxury collections...', 'loading', 'Searching premium brands and designers');
        response = await enhancedZincApiService.searchLuxuryCategories(maxResults);
      } else if (giftsForHer) {
        console.log('[UnifiedMarketplaceService] Executing gifts for her category search');
        this.showToast('Loading gifts for her...', 'loading', 'Finding thoughtful gifts she\'ll love');
        response = await enhancedZincApiService.searchGiftsForHerCategories(maxResults);
      } else if (giftsForHim) {
        console.log('[UnifiedMarketplaceService] Executing gifts for him category search');
        this.showToast('Loading gifts for him...', 'loading', 'Finding perfect gifts for him');
        response = await enhancedZincApiService.searchGiftsForHimCategories(maxResults);
      } else if (giftsUnder50) {
        console.log('[UnifiedMarketplaceService] Executing gifts under $50 category search');
        this.showToast('Loading gifts under $50...', 'loading', 'Finding affordable gift options');
        response = await enhancedZincApiService.searchGiftsUnder50Categories(maxResults);
      } else if (searchTerm.trim()) {
        console.log(`[UnifiedMarketplaceService] Executing standard search: "${searchTerm}"`);
        this.showToast(`Searching for "${searchTerm}"...`, 'loading');
        response = await enhancedZincApiService.searchProducts(searchTerm, 1, maxResults);
      } else {
        console.log('[UnifiedMarketplaceService] Loading default products');
        response = await enhancedZincApiService.getDefaultProducts(maxResults);
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
