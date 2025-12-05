/**
 * Category Registry Module - Simplified
 * 
 * This module provides backward compatibility for category search.
 * All functionality is now consolidated in ProductCatalogService.
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

export const isCategorySupported = (category: string): boolean => {
  // All categories are now supported through ProductCatalogService
  return true;
};

// Stub for CategorySearchRegistry
export const CategorySearchRegistry = {
  isSupportedCategory: (category: string) => true,
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

// Stub for CategorySearchService
export const CategorySearchService = {
  isSupportedCategory: (category: string) => true,
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
