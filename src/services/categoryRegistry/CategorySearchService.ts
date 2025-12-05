/**
 * CategorySearchService - Compatibility stub
 * @deprecated Use ProductCatalogService instead
 */

import { productCatalogService } from '../ProductCatalogService';

export interface CategorySearchOptions {
  limit?: number;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
  silent?: boolean;
}

export const CategorySearchService = {
  isSupportedCategory: (category: string): boolean => {
    // All categories supported through ProductCatalogService
    return true;
  },
  
  searchCategory: async (category: string, query: string = '', options: CategorySearchOptions = {}): Promise<any[]> => {
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

export default CategorySearchService;
