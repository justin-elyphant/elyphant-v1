/**
 * ProductCatalogService - Simplified, database-first product catalog service
 * 
 * Architecture: NO client-side cache - database (products table) is the ONLY cache
 * All filtering, sorting, and caching happens server-side in edge functions
 * 
 * This replaces:
 * - enhancedZincApiService.ts (915 lines)
 * - UnifiedMarketplaceService.ts (614 lines)
 * - OptimizedMarketplaceService.ts (290 lines)
 */

import { supabase } from "@/integrations/supabase/client";

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  sortBy?: 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest';
  gender?: string[];
  size?: string[];
  // Clothing-specific filters for sidebar
  waist?: string[];
  inseam?: string[];
  color?: string[];
}

export interface SearchOptions {
  category?: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  skipCache?: boolean;
}

export interface SearchResponse {
  products: any[];
  totalCount: number;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: string;
  };
  facets?: {
    brands?: Array<{ name: string; count: number }>;
    priceRanges?: Array<{ label: string; min: number; max: number; count: number }>;
    categories?: Array<{ name: string; count: number }>;
  };
  // Phase 2: Typo tolerance
  fuzzyMatched?: boolean;
  suggestedCorrection?: string;
  // Phase 3: Zero results
  zeroResults?: boolean;
  suggestedQueries?: string[];
  fallbackProducts?: any[];
  // Server pagination
  fromCache?: boolean;
  hasMore?: boolean;
  error?: string;
}

export interface ProductDetail {
  product_id: string;
  title: string;
  price: number;
  images: string[];
  main_image: string;
  product_description: string;
  feature_bullets: string[];
  product_details: string[];
  stars?: number;
  review_count?: number;
  all_variants?: any[];
  variant_specifics?: any[];
  metadata?: any;
}

class ProductCatalogServiceClass {
  /**
   * Search products - ALL logic handled server-side
   * NO client-side caching - database is the single source of truth
   */
  async searchProducts(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    console.log(`[ProductCatalogService] Searching: "${query}"`, options);

    try {
      const requestBody: any = {
        query: query || '',
        page: options.page || 1,
        limit: options.limit || 20,
        filters: {
          ...(options.filters || {}),
        },
      };

      // Map category to server-side handler
      if (options.category) {
        requestBody.category = options.category;
      }
      
      // Skip cache for fresh Zinc results
      if (options.skipCache) {
        requestBody.skip_cache = true;
      }

      // Add price filters
      if (options.filters?.minPrice !== undefined) {
        requestBody.filters.minPrice = options.filters.minPrice;
        requestBody.filters.min_price = options.filters.minPrice;
      }
      if (options.filters?.maxPrice !== undefined) {
        requestBody.filters.maxPrice = options.filters.maxPrice;
        requestBody.filters.max_price = options.filters.maxPrice;
      }

      const { data, error } = await supabase.functions.invoke('get-products', {
        body: requestBody
      });

      if (error) {
        console.error('[ProductCatalogService] Edge function error:', error);
        return {
          products: [],
          totalCount: 0,
          cacheStats: { hits: 0, misses: 0, hitRate: '0%' },
          error: error.message
        };
      }

      // Normalize response structure
      const products = data?.results || data?.products || [];
      
      return {
        products,
        totalCount: data?.totalCount || data?.total || products.length,
        cacheStats: data?.cacheStats || { 
          hits: data?.cacheHits || 0, 
          misses: data?.cacheMisses || 0,
          hitRate: data?.cacheHitRate || '0%'
        },
        facets: data?.facets,
        // Phase 2: Typo tolerance
        fuzzyMatched: data?.fuzzyMatched,
        suggestedCorrection: data?.suggestedCorrection,
        // Phase 3: Zero results
        zeroResults: data?.zeroResults || (products.length === 0),
        suggestedQueries: data?.suggestedQueries,
        fallbackProducts: data?.fallbackProducts,
        // Server pagination
        fromCache: data?.fromCache || false,
        hasMore: data?.hasMore || false,
      };

    } catch (error) {
      console.error('[ProductCatalogService] Search error:', error);
      return {
        products: [],
        totalCount: 0,
        cacheStats: { hits: 0, misses: 0, hitRate: '0%' },
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get product detail - fetches from cache or Zinc API
   */
  async getProductDetail(productId: string): Promise<ProductDetail | null> {
    console.log(`[ProductCatalogService] Getting product detail: ${productId}`);

    try {
      const { data, error } = await supabase.functions.invoke('get-product-detail', {
        body: { product_id: productId }
      });

      if (error) {
        console.error('[ProductCatalogService] Product detail error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[ProductCatalogService] Product detail error:', error);
      return null;
    }
  }
}

// Singleton instance
export const productCatalogService = new ProductCatalogServiceClass();

// Default export for convenience
export default productCatalogService;
