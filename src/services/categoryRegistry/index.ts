/**
 * Category Registry Module - Compatibility stub
 * 
 * @deprecated Use ProductCatalogService directly instead
 * This module exists only for backward compatibility and will be removed.
 */

import { productCatalogService } from '../ProductCatalogService';

// Stub types for backward compatibility
export type CategoryKey = string;
export type CategorySearchStrategy = 'default' | 'enhanced';
export interface CategorySearchOptions {
  limit?: number;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
  silent?: boolean;
}

// Stub registry object
export const CATEGORY_SEARCH_REGISTRY: Record<string, any> = {};

export const getCategorySearchQuery = (category: string): string => category;

export const isCategorySupported = (_category: string): boolean => true;

// Stub for CategorySearchRegistry - use ProductCatalogService instead
export const CategorySearchRegistry = {
  isSupportedCategory: () => true,
  getSearchAnalytics: () => ({ hits: 0, misses: 0, hitRate: '0%' }),
  searchCategory: async (category: string, query: string, options: CategorySearchOptions = {}) => {
    const result = await productCatalogService.searchProducts(query, {
      category,
      page: options.page || 1,
      limit: options.limit || 20,
      filters: {
        minPrice: options.minPrice,
        maxPrice: options.maxPrice,
      }
    });
    return result.products;
  }
};

// Stub for CategorySearchService - use ProductCatalogService instead
export const CategorySearchService = {
  isSupportedCategory: () => true,
  searchCategory: async (category: string, query: string, options: CategorySearchOptions = {}) => {
    const result = await productCatalogService.searchProducts(query, {
      category,
      page: options.page || 1,
      limit: options.limit || 20,
      filters: {
        minPrice: options.minPrice,
        maxPrice: options.maxPrice,
      }
    });
    return result.products;
  }
};

// Phase 1 Analytics placeholder
export const getCategoryPerformanceMetrics = () => {
  return { hits: 0, misses: 0, hitRate: '0%' };
};
