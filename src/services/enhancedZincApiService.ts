
import { supabase } from "@/integrations/supabase/client";

export interface ZincApiResponse {
  products: any[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface ZincSearchResponse {
  results: any[];
  error?: string;
  cached?: boolean;
}

export interface ZincProductDetail {
  product_id: string;
  title: string;
  price: number;
  images: string[];
  main_image: string;
  product_description: string;
  feature_bullets: string[];
  product_details: string[];
}

class EnhancedZincApiService {
  private cache = new Map();

  /**
   * Search for products using the enhanced Zinc API via Supabase Edge Function
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20, filters?: any): Promise<ZincSearchResponse> {
    console.log(`Searching products: "${query}", page: ${page}, limit: ${limit}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query,
          page,
          limit,
          filters: filters || {}
        }
      });

      if (error) {
        console.error('Error calling get-products function:', error);
        return {
          results: [],
          error: `Product search failed: ${error.message}`
        };
      }

      if (!data || !data.results) {
        console.warn('No products returned from search');
        return {
          results: [],
          error: 'No products found'
        };
      }

      return {
        results: data.results || [],
        cached: false
      };

    } catch (error) {
      console.error('Enhanced Zinc API search error:', error);
      return {
        results: [],
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId: string): Promise<any> {
    console.log(`Getting product details for: ${productId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          productId,
          action: 'details'
        }
      });

      if (error) {
        console.error('Error getting product details:', error);
        throw new Error(`Product details fetch failed: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Product details error:', error);
      throw error;
    }
  }

  /**
   * Get product detail (alias for getProductDetails for backward compatibility)
   */
  async getProductDetail(productId: string): Promise<ZincProductDetail> {
    return this.getProductDetails(productId);
  }

  /**
   * Search products by category
   */
  async searchByCategory(category: string, page: number = 1, limit: number = 20): Promise<ZincSearchResponse> {
    return this.searchProducts(`category:${category}`, page, limit);
  }

  /**
   * Search products with price range
   */
  async searchWithPriceRange(query: string, minPrice: number, maxPrice: number, page: number = 1): Promise<ZincSearchResponse> {
    return this.searchProducts(query, page, 20, {
      min_price: minPrice,
      max_price: maxPrice
    });
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Search cache cleared');
  }
}

export const enhancedZincApiService = new EnhancedZincApiService();
