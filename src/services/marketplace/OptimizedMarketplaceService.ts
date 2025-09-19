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
  // Enhanced filter options for smart searching
  waist?: string[];
  inseam?: string[];
  size?: string[];
  brand?: string[];
  color?: string[];
  material?: string[];
  style?: string[];
  features?: string[];
  gender?: string[];
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
    // Include filter options in cache key for filter-aware caching
    const filterKey = this.createFilterKey(options);
    return this.memoizedCreateCacheKey(query + filterKey, options);
  }

  private createFilterKey(options: SearchOptions): string {
    const filterParts = [];
    if (options.waist?.length) filterParts.push(`waist:${options.waist.join(',')}`);
    if (options.inseam?.length) filterParts.push(`inseam:${options.inseam.join(',')}`);
    if (options.size?.length) filterParts.push(`size:${options.size.join(',')}`);
    if (options.brand?.length) filterParts.push(`brand:${options.brand.join(',')}`);
    if (options.color?.length) filterParts.push(`color:${options.color.join(',')}`);
    if (options.material?.length) filterParts.push(`material:${options.material.join(',')}`);
    if (options.style?.length) filterParts.push(`style:${options.style.join(',')}`);
    if (options.features?.length) filterParts.push(`features:${options.features.join(',')}`);
    if (options.gender?.length) filterParts.push(`gender:${options.gender.join(',')}`);
    return filterParts.length > 0 ? `|${filterParts.join('|')}` : '';
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

      // Build enhanced query with filter context
      const enhancedQuery = this.buildEnhancedQuery(query, options);
      
      // Prepare filter options for Zinc API
      const zincFilters = this.buildZincFilters(options);

      // Use enhanced Zinc API service with filters
      const response = await enhancedZincApiService.searchProducts(
        enhancedQuery, 
        1, 
        options.limit || 20, 
        zincFilters
      );

      return response.results || [];
    } catch (error) {
      console.error('Search error in OptimizedMarketplaceService:', error);
      throw error;
    }
  }

  private buildEnhancedQuery(baseQuery: string, options: SearchOptions): string {
    const queryParts = [baseQuery];
    
    // Add filter terms to enhance search relevance
    if (options.gender?.length) {
      queryParts.push(...options.gender);
    }
    if (options.brand?.length) {
      queryParts.push(...options.brand);
    }
    if (options.color?.length) {
      queryParts.push(...options.color);
    }
    if (options.material?.length) {
      queryParts.push(...options.material);
    }
    if (options.style?.length) {
      queryParts.push(...options.style);
    }
    if (options.features?.length) {
      queryParts.push(...options.features);
    }
    
    // Add size context for better matching
    if (options.waist?.length) {
      queryParts.push(`waist sizes`);
    }
    if (options.inseam?.length) {
      queryParts.push(`inseam lengths`);
    }
    
    const enhancedQuery = queryParts.join(' ');
    console.log('🎯 Enhanced query built:', { original: baseQuery, enhanced: enhancedQuery });
    
    return enhancedQuery;
  }

  private buildZincFilters(options: SearchOptions): any {
    const filters: any = {};
    
    // Price filters
    if (options.minPrice !== undefined) {
      filters.minPrice = options.minPrice;
      filters.min_price = options.minPrice;
    }
    if (options.maxPrice !== undefined) {
      filters.maxPrice = options.maxPrice;
      filters.max_price = options.maxPrice;
    }
    
    // Smart filters for API
    if (options.waist?.length) filters.waist = options.waist;
    if (options.inseam?.length) filters.inseam = options.inseam;
    if (options.size?.length) filters.size = options.size;
    if (options.brand?.length) filters.brand = options.brand;
    if (options.color?.length) filters.color = options.color;
    if (options.material?.length) filters.material = options.material;
    if (options.style?.length) filters.style = options.style;
    if (options.features?.length) filters.features = options.features;
    if (options.gender?.length) filters.gender = options.gender;
    
    return filters;
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