import { searchZincProducts } from "@/services/api/zincApiService";
import { ZincProduct } from "@/components/marketplace/zinc/types";
import { searchCacheService } from "@/services/cache/searchCacheService";

export interface OptimizedSearchOptions {
  maxResults?: number;
  forceRefresh?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface SearchMetrics {
  totalSearches: number;
  cacheHitRate: number;
  apiCallsSaved: number;
  estimatedCostSaved: number;
  averageResponseTime: number;
}

/**
 * Optimized search service that minimizes Zinc API calls through intelligent caching
 * and query optimization while maintaining high-quality results
 */
export class OptimizedSearchService {
  private metrics: SearchMetrics = {
    totalSearches: 0,
    cacheHitRate: 0,
    apiCallsSaved: 0,
    estimatedCostSaved: 0,
    averageResponseTime: 0
  };

  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIME_SAMPLES = 100;

  /**
   * Enhanced query preprocessing to improve cache hits
   */
  private preprocessQuery(query: string): string {
    if (!query) return '';
    
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit length
  }

  /**
   * Check if query should trigger an API call
   */
  private shouldSearchAPI(query: string): boolean {
    const processed = this.preprocessQuery(query);
    
    // Minimum length check
    if (processed.length < 3) return false;
    
    // Avoid very generic terms that often yield poor results
    const genericTerms = ['gift', 'product', 'item', 'thing', 'stuff'];
    if (genericTerms.includes(processed)) return false;
    
    return true;
  }

  /**
   * Enhanced search with intelligent caching and query optimization
   */
  async searchProducts(
    query: string, 
    options: OptimizedSearchOptions = {}
  ): Promise<ZincProduct[]> {
    const startTime = Date.now();
    const {
      maxResults = 10,
      forceRefresh = false,
      priority = 'normal'
    } = options;

    this.metrics.totalSearches++;

    // Preprocess query
    const processedQuery = this.preprocessQuery(query);
    
    if (!this.shouldSearchAPI(processedQuery)) {
      console.log(`Query "${query}" filtered out - too short or generic`);
      return [];
    }

    console.log(`Optimized search for: "${processedQuery}" (original: "${query}")`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedResults = searchCacheService.getCachedResults(processedQuery);
      if (cachedResults && cachedResults.length > 0) {
        const endTime = Date.now();
        this.updateResponseTime(endTime - startTime);
        
        // Return requested number of results
        const results = cachedResults.slice(0, maxResults);
        console.log(`Cache hit: returning ${results.length} cached results for "${processedQuery}"`);
        
        return results;
      }
    }

    // Cache miss - make API call
    try {
      console.log(`Cache miss: making API call for "${processedQuery}"`);
      
      const response = await searchZincProducts(processedQuery, maxResults);
      
      if (response.error || response.fallback) {
        console.error('Zinc API error:', response.error);
        return [];
      }

      const results = response.results || [];
      
      // Convert to ZincProduct format if needed
      const zincProducts: ZincProduct[] = results.map(result => ({
        product_id: result.product_id,
        title: result.title,
        price: result.price,
        description: result.description,
        image: result.image,
        images: result.images || [result.image],
        category: result.category,
        retailer: result.retailer,
        rating: result.rating,
        review_count: result.review_count
      }));

      // Cache successful results
      if (zincProducts.length > 0) {
        searchCacheService.cacheResults(processedQuery, zincProducts);
        console.log(`API success: cached ${zincProducts.length} results for "${processedQuery}"`);
      } else {
        console.log(`API returned no results for "${processedQuery}"`);
      }

      const endTime = Date.now();
      this.updateResponseTime(endTime - startTime);

      return zincProducts.slice(0, maxResults);

    } catch (error) {
      console.error('Optimized search error:', error);
      const endTime = Date.now();
      this.updateResponseTime(endTime - startTime);
      
      return [];
    }
  }

  /**
   * Batch search for multiple queries (useful for suggestions)
   */
  async batchSearch(
    queries: string[], 
    options: OptimizedSearchOptions = {}
  ): Promise<Map<string, ZincProduct[]>> {
    const results = new Map<string, ZincProduct[]>();
    
    // Process unique queries only
    const uniqueQueries = [...new Set(queries.map(q => this.preprocessQuery(q)))];
    
    // First, check cache for all queries
    const cacheResults = new Map<string, ZincProduct[]>();
    const uncachedQueries: string[] = [];
    
    for (const query of uniqueQueries) {
      if (!this.shouldSearchAPI(query)) continue;
      
      const cached = searchCacheService.getCachedResults(query);
      if (cached && cached.length > 0) {
        cacheResults.set(query, cached);
      } else {
        uncachedQueries.push(query);
      }
    }
    
    console.log(`Batch search: ${cacheResults.size} cache hits, ${uncachedQueries.length} API calls needed`);
    
    // Add cached results
    cacheResults.forEach((products, query) => {
      results.set(query, products.slice(0, options.maxResults || 10));
    });
    
    // For uncached queries, search with delay to respect rate limits
    for (let i = 0; i < uncachedQueries.length; i++) {
      const query = uncachedQueries[i];
      
      // Add small delay between requests to avoid overwhelming API
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      try {
        const searchResults = await this.searchProducts(query, options);
        results.set(query, searchResults);
      } catch (error) {
        console.error(`Batch search error for "${query}":`, error);
        results.set(query, []);
      }
    }
    
    return results;
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only recent samples
    if (this.responseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
      this.responseTimes.shift();
    }
    
    // Update average
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Get current search metrics and cache statistics
   */
  getMetrics(): SearchMetrics & { cacheStats: any } {
    const cacheStats = searchCacheService.getStats();
    
    this.metrics.cacheHitRate = cacheStats.hitRate;
    this.metrics.apiCallsSaved = cacheStats.apiCallsSaved;
    this.metrics.estimatedCostSaved = cacheStats.costSaved;
    
    return {
      ...this.metrics,
      cacheStats
    };
  }

  /**
   * Clear all caches and reset metrics
   */
  reset(): void {
    searchCacheService.clearAll();
    this.metrics = {
      totalSearches: 0,
      cacheHitRate: 0,
      apiCallsSaved: 0,
      estimatedCostSaved: 0,
      averageResponseTime: 0
    };
    this.responseTimes = [];
    
    console.log('Search service reset - all caches cleared');
  }

  /**
   * Preload popular searches for better user experience
   */
  async preloadPopularSearches(queries: string[]): Promise<void> {
    console.log(`Preloading ${queries.length} popular searches...`);
    
    const batchResults = await this.batchSearch(queries, { 
      maxResults: 20,
      priority: 'low'
    });
    
    console.log(`Preloaded ${batchResults.size} search queries`);
  }
}

// Export singleton instance
export const optimizedSearchService = new OptimizedSearchService();
