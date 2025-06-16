
import { supabase } from "@/integrations/supabase/client";

export interface ZincApiResponse {
  products: any[];
  total: number;
  page: number;
  hasMore: boolean;
}

class EnhancedZincApiService {
  /**
   * Search for products using the enhanced Zinc API via Supabase Edge Function
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20, filters?: any): Promise<ZincApiResponse> {
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
        throw new Error(`Product search failed: ${error.message}`);
      }

      if (!data || !data.products) {
        console.warn('No products returned from search');
        return {
          products: [],
          total: 0,
          page,
          hasMore: false
        };
      }

      return {
        products: data.products || [],
        total: data.total || 0,
        page: data.page || page,
        hasMore: data.has_more || false
      };

    } catch (error) {
      console.error('Enhanced Zinc API search error:', error);
      throw error;
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
   * Search products by category
   */
  async searchByCategory(category: string, page: number = 1, limit: number = 20): Promise<ZincApiResponse> {
    return this.searchProducts(`category:${category}`, page, limit);
  }

  /**
   * Search products with price range
   */
  async searchWithPriceRange(query: string, minPrice: number, maxPrice: number, page: number = 1): Promise<ZincApiResponse> {
    return this.searchProducts(query, page, 20, {
      min_price: minPrice,
      max_price: maxPrice
    });
  }
}

export const enhancedZincApiService = new EnhancedZincApiService();
