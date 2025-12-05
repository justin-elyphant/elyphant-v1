/**
 * UnifiedMarketplaceService - Compatibility wrapper
 * 
 * This service re-exports from ProductCatalogService for backward compatibility.
 * All new code should import from ProductCatalogService directly.
 * 
 * @deprecated Use ProductCatalogService instead
 */

import { productCatalogService, type SearchOptions as CatalogSearchOptions, type SearchResponse } from '../ProductCatalogService';

// Legacy types for backward compatibility
export interface SearchOptions {
  maxResults?: number;
  page?: number;
  luxuryCategories?: boolean;
  giftsForHer?: boolean;
  giftsForHim?: boolean;
  giftsUnder50?: boolean;
  brandCategories?: boolean;
  bestSelling?: boolean;
  personId?: string;
  occasionType?: string;
  nicoleContext?: any;
  minPrice?: number;
  maxPrice?: number;
  silent?: boolean;
  bypassCache?: boolean;
}

export interface MarketplaceState {
  products: any[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  lastSearchId: string;
  hasMore: boolean;
  totalCount: number;
}

class UnifiedMarketplaceServiceClass {
  async searchProducts(query: string, options: SearchOptions = {}): Promise<any[]> {
    const catalogOptions: CatalogSearchOptions = {
      page: options.page || 1,
      limit: options.maxResults || 20,
      filters: {
        minPrice: options.minPrice,
        maxPrice: options.maxPrice,
      },
      luxuryCategories: options.luxuryCategories,
      giftsForHer: options.giftsForHer,
      giftsForHim: options.giftsForHim,
      giftsUnder50: options.giftsUnder50,
      bestSellingCategory: options.bestSelling,
    };

    const result = await productCatalogService.searchProducts(query, catalogOptions);
    return result.products;
  }

  async getProductDetails(productId: string): Promise<any> {
    return productCatalogService.getProductDetail(productId);
  }

  getCacheStats() {
    return { hits: 0, misses: 0, hitRate: '0%' };
  }
}

export const unifiedMarketplaceService = new UnifiedMarketplaceServiceClass();
export default unifiedMarketplaceService;
