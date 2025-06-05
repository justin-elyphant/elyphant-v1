
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ZincSearchResult {
  product_id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  retailer: string;
  rating?: number;
  review_count?: number;
  url?: string;
}

export interface ZincSearchResponse {
  results: ZincSearchResult[];
  total: number;
  query: string;
  cached?: boolean;
  fallback?: boolean;
  error?: string;
}

interface CacheEntry {
  data: ZincSearchResponse;
  timestamp: number;
  expiry: number;
}

class EnhancedZincApiService {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<ZincSearchResponse>> = new Map();
  private retryDelay = 1000; // 1 second base delay
  private maxRetries = 3;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadCacheFromStorage();
    // Clean expired cache entries every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  private getCacheKey(query: string, maxResults: number): string {
    return `zinc_search_${query.toLowerCase().trim()}_${maxResults}`;
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('zinc_api_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(Object.entries(cacheData));
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem('zinc_api_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = false;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned = true;
      }
    }

    if (cleaned) {
      this.saveCacheToStorage();
    }
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    return Date.now() < entry.expiry;
  }

  private setCacheEntry(key: string, data: ZincSearchResponse): void {
    const now = Date.now();
    this.cache.set(key, {
      data: { ...data, cached: true },
      timestamp: now,
      expiry: now + this.cacheExpiry
    });
    this.saveCacheToStorage();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async callZincApiWithRetry(
    query: string, 
    maxResults: number, 
    retryCount: number = 0
  ): Promise<ZincSearchResponse> {
    try {
      console.log(`Zinc API call attempt ${retryCount + 1} for query: "${query}"`);
      
      const { data, error } = await supabase.functions.invoke('zinc-search', {
        body: {
          query: query.trim(),
          maxResults: maxResults.toString()
        }
      });

      if (error) {
        throw new Error(`Zinc API error: ${error.message}`);
      }

      return data as ZincSearchResponse;

    } catch (error) {
      console.error(`Zinc API attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < this.maxRetries) {
        const delayMs = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
        return this.callZincApiWithRetry(query, maxResults, retryCount + 1);
      }
      
      throw error;
    }
  }

  async searchProducts(query: string, maxResults: number = 10): Promise<ZincSearchResponse> {
    if (!query.trim()) {
      return {
        results: [],
        total: 0,
        query,
        error: 'Empty query'
      };
    }

    const cacheKey = this.getCacheKey(query, maxResults);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCacheEntry(cached)) {
      console.log(`Returning cached results for query: "${query}"`);
      return cached.data;
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      console.log(`Returning pending request for query: "${query}"`);
      return pending;
    }

    // Create new request
    const requestPromise = this.executeSearch(query, maxResults, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeSearch(
    query: string, 
    maxResults: number, 
    cacheKey: string
  ): Promise<ZincSearchResponse> {
    try {
      const result = await this.callZincApiWithRetry(query, maxResults);
      
      if (result.results && result.results.length > 0) {
        // Cache successful results
        this.setCacheEntry(cacheKey, result);
        console.log(`Cached ${result.results.length} results for query: "${query}"`);
      }
      
      return result;

    } catch (error) {
      console.error('All Zinc API retry attempts failed:', error);
      
      // Try to return stale cache if available
      const staleCache = this.cache.get(cacheKey);
      if (staleCache) {
        console.log(`Returning stale cache for query: "${query}"`);
        toast.warning('Using cached results', {
          description: 'Live search temporarily unavailable'
        });
        return { ...staleCache.data, cached: true };
      }
      
      // Return fallback response
      return {
        results: [],
        total: 0,
        query,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Batch search for multiple queries
  async batchSearch(queries: string[], maxResults: number = 10): Promise<ZincSearchResponse[]> {
    const promises = queries.map(query => this.searchProducts(query, maxResults));
    return Promise.all(promises);
  }

  // Prefetch popular searches
  async prefetchPopularSearches(): Promise<void> {
    const popularQueries = [
      'electronics',
      'clothing',
      'books',
      'home decor',
      'kitchen'
    ];

    try {
      await this.batchSearch(popularQueries, 5);
      console.log('Popular searches prefetched successfully');
    } catch (error) {
      console.warn('Failed to prefetch popular searches:', error);
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('zinc_api_cache');
    console.log('Zinc API cache cleared');
  }

  // Get cache stats
  getCacheStats(): { size: number; hits: number; misses: number } {
    const size = this.cache.size;
    // In a real implementation, you'd track hits/misses
    return { size, hits: 0, misses: 0 };
  }
}

// Export singleton instance
export const enhancedZincApiService = new EnhancedZincApiService();

// Convenience function for backward compatibility
export const searchZincProducts = (query: string, maxResults: number = 10) => {
  return enhancedZincApiService.searchProducts(query, maxResults);
};

// Test connection function
export const testZincConnection = async (): Promise<boolean> => {
  try {
    const result = await enhancedZincApiService.searchProducts("test", 1);
    return !result.fallback && !result.error;
  } catch {
    return false;
  }
};
