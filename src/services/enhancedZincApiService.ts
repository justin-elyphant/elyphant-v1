
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
  // Enhanced best seller fields
  isBestSeller?: boolean;
  bestSellerType?: 'amazon_choice' | 'best_seller' | 'popular' | 'top_rated' | 'highly_rated' | null;
  badgeText?: string | null;
  best_seller_rank?: number;
}

class EnhancedZincApiService {
  private cache = new Map();

  /**
   * Process and enhance product data with best seller information
   */
  private enhanceProductData(product: any): any {
    // Ensure best seller data is properly mapped
    const enhanced = {
      ...product,
      isBestSeller: product.isBestSeller || false,
      bestSellerType: product.bestSellerType || null,
      badgeText: product.badgeText || null,
    };

    // Log best seller detection for debugging
    if (enhanced.isBestSeller) {
      console.log(`Best seller detected: ${enhanced.title}`, {
        type: enhanced.bestSellerType,
        badge: enhanced.badgeText,
        rank: enhanced.best_seller_rank || enhanced.sales_rank
      });
    }

    return enhanced;
  }

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

      // Enhance product data with best seller information
      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      return {
        results: enhancedResults || [],
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
      const { data, error } = await supabase.functions.invoke('get-product-detail', {
        body: {
          product_id: productId,
          retailer: 'amazon'
        }
      });

      if (error) {
        console.error('Error getting product details:', error);
        throw new Error(`Product details fetch failed: ${error.message}`);
      }

      // Enhance the detailed product data
      return this.enhanceProductData(data);

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
   * Get default marketplace products (best sellers and popular items)
   */
  async getDefaultProducts(limit: number = 20): Promise<ZincSearchResponse> {
    console.log('Loading default marketplace products...');
    
    try {
      // Search for best selling gifts as default products
      const response = await this.searchProducts('best selling gifts', 1, limit);
      
      if (response.results && response.results.length > 0) {
        console.log(`Loaded ${response.results.length} default products`);
        return response;
      }
      
      // Fallback to popular categories if no best sellers found
      console.log('No best sellers found, trying popular categories...');
      const fallbackResponse = await this.searchProducts('popular gifts', 1, limit);
      
      return fallbackResponse;
      
    } catch (error) {
      console.error('Error loading default products:', error);
      return {
        results: [],
        error: 'Failed to load default products'
      };
    }
  }

  /**
   * Search products by category
   */
  async searchByCategory(category: string, page: number = 1, limit: number = 20): Promise<ZincSearchResponse> {
    return this.searchProducts(`category:${category}`, page, limit);
  }

  async searchWithPriceRange(query: string, minPrice: number, maxPrice: number, page: number = 1): Promise<ZincSearchResponse> {
    return this.searchProducts(query, page, 20, {
      min_price: minPrice,
      max_price: maxPrice
    });
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Search cache cleared');
  }
}

export const enhancedZincApiService = new EnhancedZincApiService();
