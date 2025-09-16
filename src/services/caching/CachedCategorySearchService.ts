/**
 * Phase 2: Cache Integration with Category Search Registry
 * 
 * This service integrates the Enhanced Cache Service with the Category Search Registry
 * while maintaining all existing protective measures and backward compatibility.
 */

import { CategorySearchRegistry, type CategorySearchOptions } from '../categoryRegistry/CategorySearchRegistry';
import { EnhancedCacheService } from './EnhancedCacheService';
import { enhancedZincApiService } from '../enhancedZincApiService';

export interface CachedCategorySearchOptions extends CategorySearchOptions {
  skipCache?: boolean;
  warmCache?: boolean;
}

/**
 * Cache-Enhanced Category Search Service
 * 
 * Integrates multi-layer caching with category searches while preserving
 * all existing protective measures from Phase 1.
 */
export class CachedCategorySearchService {
  private static mapCache = new Map<string, any>();
  
  // Popular categories and terms for cache warming
  private static readonly CACHE_WARMING_CONFIG = {
    categories: [
      'best-selling',
      'electronics', 
      'gifts-for-her',
      'gifts-for-him',
      'luxury',
      'gifts-under-50'
    ],
    intervals: {
      popular: 15 * 60,   // 15 minutes
      standard: 60 * 60,  // 1 hour
      fallback: 4 * 60 * 60 // 4 hours
    },
    priorityTerms: [
      'smartphones',
      'headphones',
      'laptops',
      'skincare',
      'jewelry',
      'watches',
      'fitness',
      'books'
    ]
  };

  /**
   * Execute cached category search with multi-layer caching
   */
  static async searchCategory(
    category: string,
    searchTerm: string = '',
    options: CachedCategorySearchOptions = {}
  ): Promise<any> {
    const { skipCache = false, warmCache = false, ...searchOptions } = options;
    
    console.log(`[CachedCategorySearchService] Searching category: ${category}`, {
      searchTerm,
      skipCache,
      warmCache,
      options: searchOptions
    });

    try {
      // Check cache first (unless explicitly skipped)
      if (!skipCache) {
        const cachedResult = await EnhancedCacheService.get(
          'category-search',
          category,
          searchTerm,
          searchOptions,
          this.mapCache
        );

        if (cachedResult && cachedResult.data) {
          console.log(`[CachedCategorySearchService] Returning cached results for: ${category}`);
          return cachedResult.data;
        }
      }

      // Cache miss - execute search via CategorySearchRegistry (Phase 1)
      console.log(`[CachedCategorySearchService] Cache miss, executing fresh search for: ${category}`);
      const results = await CategorySearchRegistry.executeSearch(category, searchTerm, searchOptions);

      // Cache the results if successful  
      if (results && (results.results || Array.isArray(results))) {
        await EnhancedCacheService.set(
          'category-search',
          category,
          searchTerm,
          results,
          searchOptions,
          this.mapCache
        );

        // Optionally warm related cache entries
        if (warmCache) {
          this.warmRelatedCategories(category).catch(error => 
            console.error('Cache warming failed:', error)
          );
        }
      }

      return results;

    } catch (error) {
      console.error(`[CachedCategorySearchService] Search failed for category: ${category}`, error);
      throw error;
    }
  }

  /**
   * Execute cached brand search with enhanced caching
   */
  static async searchBrand(
    brandName: string,
    searchOptions: CachedCategorySearchOptions = {}
  ): Promise<any> {
    const { skipCache = false, ...options } = searchOptions;

    try {
      // Check cache first
      if (!skipCache) {
        const cachedResult = await EnhancedCacheService.get(
          'brand-search',
          'brand-categories',
          brandName,
          options,
          this.mapCache
        );

        if (cachedResult && cachedResult.data) {
          console.log(`[CachedCategorySearchService] Returning cached brand results for: ${brandName}`);
          return cachedResult.data;
        }
      }

      // Cache miss - execute brand search
      console.log(`[CachedCategorySearchService] Executing fresh brand search for: ${brandName}`);
      const results = await enhancedZincApiService.searchBrandCategories(
        brandName,
        options.limit || 20,
        { minPrice: options.minPrice, maxPrice: options.maxPrice }
      );

      // Cache the results
      if (results && (results.results || (Array.isArray(results) && results.length > 0))) {
        await EnhancedCacheService.set(
          'brand-search',
          'brand-categories',
          brandName,
          results,
          options,
          this.mapCache
        );
      }

      return results;

    } catch (error) {
      console.error(`[CachedCategorySearchService] Brand search failed for: ${brandName}`, error);
      throw error;
    }
  }

  /**
   * Warm cache for popular categories and search terms
   */
  static async startCacheWarming(): Promise<void> {
    console.log('[CachedCategorySearchService] Starting cache warming process...');

    try {
      await EnhancedCacheService.warmCache(
        async (category: string, term?: string, options?: any) => {
          if (category === 'default' && term) {
            // Search term warming
            return await enhancedZincApiService.searchProducts(term, 1, options?.limit || 20, options);
          } else {
            // Category warming
            return await CategorySearchRegistry.executeSearch(category, term || '', options || {});
          }
        },
        this.CACHE_WARMING_CONFIG,
        this.mapCache
      );

    } catch (error) {
      console.error('[CachedCategorySearchService] Cache warming failed:', error);
      // Don't throw - warming failure shouldn't break the application
    }
  }

  /**
   * Warm cache for categories related to the current one
   */
  private static async warmRelatedCategories(category: string): Promise<void> {
    const relatedCategories = this.getRelatedCategories(category);
    
    const warmingPromises = relatedCategories.map(async (relatedCategory) => {
      try {
        const existing = await EnhancedCacheService.get(
          'category-search',
          relatedCategory,
          '',
          {},
          this.mapCache
        );
        
        if (!existing) {
          console.log(`[CachedCategorySearchService] Warming related category: ${relatedCategory}`);
          const results = await CategorySearchRegistry.executeSearch(relatedCategory, '', { limit: 15 });
          
          if (results && (results.results || results.length > 0)) {
            await EnhancedCacheService.set(
              'category-search',
              relatedCategory,
              '',
              results,
              {},
              this.mapCache
            );
          }
        }
      } catch (error) {
        console.error(`Failed to warm related category ${relatedCategory}:`, error);
      }
    });

    await Promise.allSettled(warmingPromises);
  }

  /**
   * Get categories related to the current category for intelligent cache warming
   */
  private static getRelatedCategories(category: string): string[] {
    const relationships: Record<string, string[]> = {
      'electronics': ['best-selling', 'gifts-for-him'],
      'gifts-for-her': ['luxury', 'gifts-under-50'],
      'gifts-for-him': ['electronics', 'gifts-under-50'],
      'best-selling': ['electronics', 'gifts-for-her', 'gifts-for-him'],
      'luxury': ['gifts-for-her', 'gifts-for-him'],
      'gifts-under-50': ['gifts-for-her', 'gifts-for-him']
    };

    return relationships[category] || [];
  }

  /**
   * Invalidate cache for a category (useful for updates)
   */
  static async invalidateCategory(category: string): Promise<void> {
    console.log(`[CachedCategorySearchService] Invalidating cache for category: ${category}`);
    await EnhancedCacheService.invalidatePattern(category, this.mapCache);
  }

  /**
   * Get cache performance statistics
   */
  static async getCacheStats(): Promise<any> {
    const enhancedStats = await EnhancedCacheService.getCacheStats(this.mapCache);
    
    return {
      ...enhancedStats,
      serviceName: 'CachedCategorySearchService',
      warmingConfig: this.CACHE_WARMING_CONFIG,
      supportedOperations: [
        'searchCategory',
        'searchBrand', 
        'startCacheWarming',
        'invalidateCategory'
      ]
    };
  }

  /**
   * Check if a category is supported (delegates to Phase 1 registry)
   */
  static isCategorySupported(category: string): boolean {
    return CategorySearchRegistry.isCategorySupported(category);
  }

  /**
   * Get supported categories (delegates to Phase 1 registry)
   */
  static getSupportedCategories(): string[] {
    return CategorySearchRegistry.getSupportedCategories();
  }
}

// Auto-start cache warming in background (non-blocking)
if (typeof window === 'undefined') {
  // Only on server-side
  setTimeout(() => {
    CachedCategorySearchService.startCacheWarming().catch(error =>
      console.error('Background cache warming failed:', error)
    );
  }, 5000); // Wait 5 seconds after module load
}