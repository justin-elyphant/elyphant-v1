/**
 * OptimizedMarketplaceService - Compatibility wrapper
 * 
 * This service re-exports from ProductCatalogService for backward compatibility.
 * All new code should import from ProductCatalogService directly.
 * 
 * @deprecated Use ProductCatalogService instead
 */

import { productCatalogService, type SearchOptions } from '../ProductCatalogService';

class OptimizedMarketplaceServiceClass {
  async searchProducts(query: string, options: any = {}): Promise<any[]> {
    const result = await productCatalogService.searchProducts(query, {
      page: options.page || 1,
      limit: options.limit || 20,
      filters: {
        minPrice: options.minPrice,
        maxPrice: options.maxPrice,
        brands: options.brand,
        gender: options.gender,
        size: options.size,
      },
      luxuryCategories: options.luxuryCategories,
      giftsForHer: options.giftsForHer,
      giftsForHim: options.giftsForHim,
      giftsUnder50: options.giftsUnder50,
      bestSellingCategory: options.bestSelling,
    });
    return result.products;
  }
}

export const optimizedMarketplaceService = new OptimizedMarketplaceServiceClass();
export default optimizedMarketplaceService;
