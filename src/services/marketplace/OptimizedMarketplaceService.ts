import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { createBoundedMemoization } from "@/utils/performanceOptimizations";
import { Product } from "@/types/product";

interface SearchOptions {
  page?: number;
  limit?: number;
  luxuryCategories?: boolean;
  brandCategories?: boolean;
  personId?: string;
  occasionType?: string;
  nicoleContext?: any;
  minPrice?: number;
  maxPrice?: number;
}

interface CacheEntry {
  data: Product[];
  timestamp: number;
  ttl: number;
}

class OptimizedMarketplaceService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private pendingRequests = new Map<string, Promise<Product[]>>();

  // Bounded memoization for expensive operations
  private memoizedCreateCacheKey = createBoundedMemoization((
    query: string, 
    options: SearchOptions
  ) => {
    const normalizedQuery = query.toLowerCase().trim();
    const optionsKey = Object.keys(options)
      .sort()
      .map(key => `${key}:${options[key as keyof SearchOptions]}`)
      .join('|');
    return `${normalizedQuery}::${optionsKey}`;
  }, 50);

  private createCacheKey(query: string, options: SearchOptions): string {
    return this.memoizedCreateCacheKey(query, options);
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Limit cache size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private getFromCache(cacheKey: string): Product[] | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  private saveToCache(cacheKey: string, data: Product[], ttl: number = this.DEFAULT_TTL): void {
    // Periodic cleanup
    if (Math.random() < 0.1) {
      this.cleanupCache();
    }

    this.cache.set(cacheKey, {
      data: [...data], // Create defensive copy
      timestamp: Date.now(),
      ttl
    });
  }

  private async performSearch(query: string, options: SearchOptions): Promise<Product[]> {
    try {
      console.log('🚀 Optimized search performing:', { query, options });

      // Use enhanced Zinc API service
      const response = await enhancedZincApiService.searchProducts(query, options.limit || 20);

      return response.results || [];
    } catch (error) {
      console.error('Search error in OptimizedMarketplaceService:', error);
      throw error;
    }
  }

  async searchProducts(query: string, options: SearchOptions = {}): Promise<Product[]> {
    const cacheKey = this.createCacheKey(query, options);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('🎯 Cache hit for:', cacheKey);
      return cached;
    }

    // Check for pending request to avoid duplicates
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log('🔄 Reusing pending request for:', cacheKey);
      return pendingRequest;
    }

    // Create new request
    const searchPromise = this.performSearch(query, options);
    this.pendingRequests.set(cacheKey, searchPromise);

    try {
      const results = await searchPromise;
      
      // Cache successful results
      this.saveToCache(cacheKey, results);
      
      console.log('✅ Search completed and cached:', { 
        query, 
        resultsCount: results.length,
        cacheKey 
      });
      
      return results;
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Batch multiple searches for efficiency
  async batchSearchProducts(searches: Array<{ query: string; options?: SearchOptions }>): Promise<Product[][]> {
    const promises = searches.map(({ query, options = {} }) => 
      this.searchProducts(query, options)
    );
    
    return Promise.all(promises);
  }

  // Preload likely searches based on user behavior
  async preloadSearches(queries: string[], options: SearchOptions = {}): Promise<void> {
    const promises = queries.map(query => 
      this.searchProducts(query, { ...options, limit: 10 }) // Smaller limit for preloading
        .catch(error => {
          console.warn('Preload failed for query:', query, error);
          return [];
        })
    );
    
    await Promise.all(promises);
    console.log('🚀 Preloaded searches for:', queries);
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxSize: this.MAX_CACHE_SIZE,
      defaultTtl: this.DEFAULT_TTL
    };
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }
}

export const optimizedMarketplaceService = new OptimizedMarketplaceService();