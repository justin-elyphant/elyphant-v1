
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PerformanceMonitor } from "@/utils/performanceMonitoring";

export interface ZincSearchResult {
  product_id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  retailer: string;
  stars?: number;
  num_reviews?: number;
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
  private retryDelay = 1000;
  private maxRetries = 3;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private performanceMonitor = PerformanceMonitor.getInstance();

  constructor() {
    this.loadCacheFromStorage();
    // Clean expired cache entries every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  private getCacheKey(query: string, page: number): string {
    return `zinc_search_${query.toLowerCase().trim()}_${page}`;
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
    page: number,
    maxResults: number, 
    retryCount: number = 0
  ): Promise<ZincSearchResponse> {
    const startTime = performance.now();
    
    try {
      console.log(`Zinc API call attempt ${retryCount + 1} for query: "${query}"`);
      
      query = query + " gift";
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query: query.trim(),
          page: page,
          maxResults: maxResults.toString()
        }
      });

      if (error) {
        throw new Error(`Zinc API error: ${error.message}`);
      }

      // Track successful API call performance
      const duration = performance.now() - startTime;
      this.performanceMonitor.trackApiCall('get-products', duration);

      console.log("call zinc api", data);
      return data as ZincSearchResponse;

    } catch (error) {
      console.error(`Zinc API attempt ${retryCount + 1} failed:`, error);
      
      // Track failed API call performance
      const duration = performance.now() - startTime;
      this.performanceMonitor.trackApiCall('zinc-search-error', duration);
      
      if (retryCount < this.maxRetries) {
        const delayMs = this.retryDelay * Math.pow(2, retryCount);
        console.log(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
        return this.callZincApiWithRetry(query, maxResults, retryCount + 1);
      }
      
      throw error;
    }
  }

  async searchProducts(query: string, page: number = 1, maxResults: number = 10): Promise<ZincSearchResponse> {
    console.log("searchProducts");
    // if (!query.trim()) {
    //   return {
    //     results: [],
    //     total: 0,
    //     query,
    //     error: 'Empty query'
    //   };
    // }

    const cacheKey = this.getCacheKey(query, page);
    
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

    // Create new request with performance tracking
    const requestPromise = this.executeSearchWithPerformanceTracking(query, page, maxResults, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeSearchWithPerformanceTracking(
    query: string, 
    page: number,
    maxResults: number, 
    cacheKey: string
  ): Promise<ZincSearchResponse> {
    const startTime = performance.now();
    
    try {
      const result = await this.callZincApiWithRetry(query, page, maxResults);
      
      if (result.results && result.results.length > 0) {
        // Cache successful results
        this.setCacheEntry(cacheKey, result);
        console.log(`Cached ${result.results.length} results for query: "${query}"`);
      }
      
      // Track successful search performance
      const duration = performance.now() - startTime;
      this.performanceMonitor.trackApiCall(`zinc-search-${query}`, duration);
      
      return result;

    } catch (error) {
      console.error('All Zinc API retry attempts failed:', error);
      
      // Track failed search performance
      const duration = performance.now() - startTime;
      this.performanceMonitor.trackApiCall(`zinc-search-failed-${query}`, duration);
      
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

  // Batch search with performance optimization
  async batchSearch(queries: string[], page: number = 1, maxResults: number = 10): Promise<ZincSearchResponse[]> {
    const startTime = performance.now();
    
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const promises = queries.map(query => this.searchProducts(query, page, maxResults));
      const results = await Promise.allSettled(promises);
      
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<ZincSearchResponse> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      // Track batch performance
      const duration = performance.now() - startTime;
      this.performanceMonitor.trackApiCall('zinc-batch-search', duration);
      
      return successfulResults;
    } catch (error) {
      console.error('Batch search failed:', error);
      return [];
    }
  }

  // Prefetch with better error handling and performance tracking
  async prefetchPopularSearches(): Promise<ZincSearchResponse[]> {
    const popularQueries = [
      'electronics',
      'clothing', 
      'books',
      'kitchen'
    ];

    try {
      // Prefetch in small batches to avoid overwhelming the API
      const batchSize = 2;

      const totalResults: ZincSearchResponse[] = [];
      for (let i = 0; i < popularQueries.length; i += batchSize) {
        const batch = popularQueries.slice(i, i + batchSize);
        const results = await this.batchSearch(batch, 1, 50);
        totalResults.push(...results);
        
        // Small delay between batches
        if (i + batchSize < popularQueries.length) {
          await this.delay(500);
        }
      }
      
      console.log('Popular searches prefetched successfully');
      return totalResults;
    } catch (error) {
      console.warn('Failed to prefetch popular searches:', error);
      return [];
    }
  }

  // Enhanced cache management
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('zinc_api_cache');
    console.log('Zinc API cache cleared');
  }

  getCacheStats(): { size: number; totalSize: string; oldestEntry: string } {
    const size = this.cache.size;
    let totalBytes = 0;
    let oldestTimestamp = Date.now();
    
    this.cache.forEach((entry) => {
      totalBytes += JSON.stringify(entry).length;
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });
    
    return { 
      size, 
      totalSize: `${(totalBytes / 1024).toFixed(2)}KB`,
      oldestEntry: new Date(oldestTimestamp).toISOString()
    };
  }

  // Performance monitoring integration
  getPerformanceMetrics() {
    return this.performanceMonitor.getPerformanceReport();
  }
}

// Export singleton instance
export const enhancedZincApiService = new EnhancedZincApiService();

// Convenience function for backward compatibility
export const searchZincProducts = (query: string, maxResults: number = 10) => {
  return enhancedZincApiService.searchProducts(query, maxResults);
};

// Test connection function with performance tracking
export const testZincConnection = async (): Promise<boolean> => {
  try {
    const result = await enhancedZincApiService.searchProducts("test", 1, 1);
    return !result.fallback && !result.error;
  } catch {
    return false;
  }
};
