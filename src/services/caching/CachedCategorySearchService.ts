/**
 * CachedCategorySearchService - Compatibility stub
 * @deprecated Use ProductCatalogService directly instead
 * 
 * The database (products table) is now the single source of truth for caching.
 */

import { CategorySearchRegistry, type CategorySearchOptions } from '../categoryRegistry/CategorySearchRegistry';
import { productCatalogService } from '../ProductCatalogService';

export interface CachedCategorySearchOptions extends CategorySearchOptions {
  skipCache?: boolean;
  warmCache?: boolean;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Cache-Enhanced Category Search Service (Legacy Stub)
 */
export class CachedCategorySearchService {
  private static mapCache = new Map<string, any>();
  
  static async searchCategory(
    category: string, 
    query: string = '', 
    options: CachedCategorySearchOptions = {}
  ): Promise<any[]> {
    console.warn('CachedCategorySearchService is deprecated. Use ProductCatalogService instead.');
    
    try {
      const response = await productCatalogService.searchProducts(query || category, {
        category,
        page: options.page || 1,
        limit: options.limit || options.maxResults || 20,
        filters: {
          minPrice: options.minPrice,
          maxPrice: options.maxPrice,
        }
      });
      
      return response.products || [];
    } catch (error) {
      console.error('CachedCategorySearchService error:', error);
      return [];
    }
  }

  static getCacheStats() {
    return {
      size: this.mapCache.size,
      hits: 0,
      misses: 0,
      hitRate: '0%'
    };
  }

  static clearCache() {
    this.mapCache.clear();
  }

  static warmCache(_categories: string[]): Promise<void> {
    // No-op - caching is now handled server-side
    return Promise.resolve();
  }
}

export default CachedCategorySearchService;
