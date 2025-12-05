/**
 * Smart Caching Service - Phase 3: Smart Caching & Pre-filtering
 * Implements intelligent caching and category-aware API strategies
 */

import { productCatalogService } from "@/services/ProductCatalogService";
import { detectCategoryFromSearch } from "@/components/marketplace/utils/smartFilterDetection";
import { extractAdvancedSizes } from "@/utils/advancedSizeDetection";

export interface CacheEntry {
  data: any[];
  timestamp: number;
  category?: string;
  sizeAnalysis?: {
    totalSizes: number;
    sizeTypes: string[];
    representativeDistribution: boolean;
  };
  searchMeta: {
    originalQuery: string;
    enhancedQueries: string[];
    resultCount: number;
  };
}

export interface SmartSearchStrategy {
  queries: string[];
  maxResultsPerQuery: number;
  prioritizeFirstQuery: boolean;
  cacheDuration: number;
  sizeOptimization: boolean;
}

class SmartCachingService {
  private cache = new Map<string, CacheEntry>();
  private sizeAwareCache = new Map<string, any[]>(); // Category + size specific cache
  private readonly DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly SIZE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for size-specific searches

  /**
   * Generate cache key with size awareness
   */
  private generateCacheKey(query: string, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `search_${query}_${filterStr}`.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Generate size-aware cache key
   */
  private generateSizeCacheKey(category: string, sizeType: string, sizeValues: string[]): string {
    return `size_${category}_${sizeType}_${sizeValues.sort().join('_')}`;
  }

  /**
   * Analyze size representation in search results
   */
  private analyzeSizeRepresentation(products: any[]): {
    totalSizes: number;
    sizeTypes: string[];
    representativeDistribution: boolean;
  } {
    const sizes = extractAdvancedSizes(products);
    const totalSizes = sizes.waist.length + sizes.inseam.length + sizes.shoes.length + sizes.clothing.length;
    
    const sizeTypes: string[] = [];
    if (sizes.waist.length > 0) sizeTypes.push('waist');
    if (sizes.inseam.length > 0) sizeTypes.push('inseam');
    if (sizes.shoes.length > 0) sizeTypes.push('shoes');
    if (sizes.clothing.length > 0) sizeTypes.push('clothing');

    // Consider distribution representative if we have multiple sizes in relevant categories
    const representativeDistribution = totalSizes >= 5 && sizeTypes.length > 0;

    return {
      totalSizes,
      sizeTypes,
      representativeDistribution
    };
  }

  /**
   * Smart search with size-aware caching
   */
  async smartSearch(
    query: string, 
    maxResults: number = 50, 
    filters?: any
  ): Promise<{ results: any[]; fromCache: boolean; sizeOptimized: boolean }> {
    const cacheKey = this.generateCacheKey(query, filters);
    const category = detectCategoryFromSearch(query);
    
    // Check primary cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.DEFAULT_CACHE_DURATION) {
      console.log(`Smart cache HIT: ${cacheKey}`);
      return { 
        results: cached.data, 
        fromCache: true, 
        sizeOptimized: cached.sizeAnalysis?.representativeDistribution || false 
      };
    }

    // Check size-aware cache for apparel categories
    if (category === 'clothing' && filters) {
      const sizeResults = await this.searchWithSizeOptimization(query, maxResults, filters);
      if (sizeResults.length > 0) {
        return { 
          results: sizeResults, 
          fromCache: false, 
          sizeOptimized: true 
        };
      }
    }

    // Fallback to regular search via ProductCatalogService
    const response = await productCatalogService.searchProducts(query, { limit: maxResults, ...filters });
    const results = response.products || [];

    // Cache results with size analysis
    const sizeAnalysis = this.analyzeSizeRepresentation(results);
    this.cache.set(cacheKey, {
      data: results,
      timestamp: Date.now(),
      category,
      sizeAnalysis,
      searchMeta: {
        originalQuery: query,
        enhancedQueries: [query],
        resultCount: results.length
      }
    });

    return { 
      results, 
      fromCache: false, 
      sizeOptimized: sizeAnalysis.representativeDistribution 
    };
  }

  /**
   * Size-optimized search for apparel categories
   */
  private async searchWithSizeOptimization(
    query: string, 
    maxResults: number, 
    filters: any
  ): Promise<any[]> {
    const category = detectCategoryFromSearch(query);
    
    if (category !== 'clothing') {
      return [];
    }

    // Create size-specific search strategy
    const sizeStrategies = this.createSizeSearchStrategies(query, maxResults);
    const allResults: any[] = [];
    const seenProducts = new Set<string>();

    for (const strategy of sizeStrategies) {
      try {
        const response = await productCatalogService.searchProducts(
          strategy.query, 
          { limit: strategy.maxResults, ...filters, ...strategy.filters }
        );

        if (response.products && response.products.length > 0) {
          // Deduplicate results
          response.products.forEach(product => {
            if (!seenProducts.has(product.product_id)) {
              allResults.push(product);
              seenProducts.add(product.product_id);
            }
          });
        }

        // Stop if we have enough results
        if (allResults.length >= maxResults) {
          break;
        }
      } catch (error) {
        console.warn(`Size strategy failed for: ${strategy.query}`, error);
      }
    }

    // Cache size-optimized results
    if (allResults.length > 0) {
      const sizeCacheKey = this.generateSizeCacheKey(
        category, 
        'mixed', 
        ['optimized']
      );
      this.sizeAwareCache.set(sizeCacheKey, allResults);
    }

    return allResults.slice(0, maxResults);
  }

  /**
   * Create size-aware search strategies
   */
  private createSizeSearchStrategies(query: string, maxResults: number): Array<{
    query: string;
    maxResults: number;
    filters: any;
  }> {
    const strategies: Array<{ query: string; maxResults: number; filters: any }> = [];
    const baseResultsPerStrategy = Math.floor(maxResults / 3);

    // Strategy 1: Small sizes
    strategies.push({
      query: `${query} size S M small medium`,
      maxResults: baseResultsPerStrategy,
      filters: {}
    });

    // Strategy 2: Large sizes  
    strategies.push({
      query: `${query} size L XL large extra large`,
      maxResults: baseResultsPerStrategy,
      filters: {}
    });

    // Strategy 3: Numeric sizes (for jeans/pants)
    if (query.toLowerCase().includes('jeans') || query.toLowerCase().includes('pants')) {
      strategies.push({
        query: `${query} 30W 32W 34W 36W waist`,
        maxResults: baseResultsPerStrategy,
        filters: {}
      });
    } else {
      // General size range
      strategies.push({
        query: `${query} various sizes available`,
        maxResults: baseResultsPerStrategy,
        filters: {}
      });
    }

    return strategies;
  }

  /**
   * Predictive size caching for popular searches
   */
  async preCacheSizeCombinations(category: string, popularSizes: string[]): Promise<void> {
    if (category !== 'clothing') return;

    const baseMethods = [
      'jeans', 'pants', 'shirts', 'dresses', 'shoes'
    ];

    for (const method of baseMethods) {
      for (const size of popularSizes.slice(0, 5)) { // Limit to top 5 sizes
        const cacheKey = this.generateSizeCacheKey(category, method, [size]);
        
        if (!this.sizeAwareCache.has(cacheKey)) {
          try {
            const response = await productCatalogService.searchProducts(
              `${method} size ${size}`, 
              { limit: 20 }
            );
            
            if (response.products && response.products.length > 0) {
              this.sizeAwareCache.set(cacheKey, response.products);
              console.log(`Pre-cached: ${method} size ${size}`);
            }
          } catch (error) {
            console.warn(`Pre-cache failed for ${method} size ${size}:`, error);
          }
        }
      }
    }
  }

  /**
   * Get cached size combinations
   */
  getCachedSizeCombination(category: string, sizeType: string, size: string): any[] | null {
    const cacheKey = this.generateSizeCacheKey(category, sizeType, [size]);
    return this.sizeAwareCache.get(cacheKey) || null;
  }

  /**
   * Smart cache cleanup
   */
  cleanup(): void {
    const now = Date.now();
    
    // Clean regular cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.DEFAULT_CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
    
    // Clean size cache (longer duration)
    // Size cache doesn't have timestamps, so we'll implement a simple LRU
    if (this.sizeAwareCache.size > 100) {
      const entries = Array.from(this.sizeAwareCache.entries());
      // Keep only the last 50 entries
      this.sizeAwareCache.clear();
      entries.slice(-50).forEach(([key, value]) => {
        this.sizeAwareCache.set(key, value);
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    regularCacheSize: number;
    sizeCacheSize: number;
    representativeResults: number;
  } {
    const representativeResults = Array.from(this.cache.values())
      .filter(entry => entry.sizeAnalysis?.representativeDistribution)
      .length;

    return {
      regularCacheSize: this.cache.size,
      sizeCacheSize: this.sizeAwareCache.size,
      representativeResults
    };
  }
}

export const smartCachingService = new SmartCachingService();
