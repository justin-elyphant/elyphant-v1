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
  source?: string;
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

// Category-specific search queries that Zinc API understands better
const CATEGORY_SEARCH_QUERIES = {
  electronics: "best selling electronics phones computers laptops headphones cameras",
  tech: "best selling tech electronics Apple gaming headphones speakers smart watch wireless earbuds iPad tablet Nintendo PlayStation",
  beauty: "best selling skincare makeup cosmetics beauty products personal care",
  homeKitchen: "kitchen home cooking utensils cookware appliances storage organization tools gadgets",
  // New categories to match getFeaturedCategories()
  arts: "arts crafts supplies scrapbooking painting drawing crafting tools materials",
  athleisure: "athletic wear yoga pants leggings activewear fitness clothing gym wear",
  books: "best selling books novels fiction non-fiction educational textbooks",
  fashion: "clothing apparel shoes accessories fashion style trending outfits",
  flowers: "fresh flowers bouquet delivery roses tulips arrangements floral gifts",
  food: "gourmet food specialty snacks organic coffee tea chocolate wine cheese",
  home: "home decor furniture accessories organization storage household items",
  pets: "pet supplies dog cat accessories toys treats food pet care",
  sports: "sports equipment fitness gear outdoor recreation exercise equipment",
  toys: "toys games kids children educational fun entertainment play"
};

/**
 * Enhanced Zinc API Service with Nicole-Aware Fallback System
 * Fixed to handle 405 errors and provide budget-appropriate results
 */
class EnhancedZincApiService {
  private cache = new Map();

  /**
   * Main search method - calls Zinc API and throws errors for fallback handling
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20, filters?: any): Promise<ZincSearchResponse> {
    console.log(`🔍 [EnhancedZincApiService] Starting search for: "${query}", page: ${page}, limit: ${limit}, filters:`, filters);
    
    // Try zinc-search edge function
    const primaryResult = await this.callZincSearchFunction(query, limit, filters);
    
    if (primaryResult && !primaryResult.error && primaryResult.results?.length > 0) {
      console.log(`✅ [EnhancedZincApiService] SUCCESS with zinc-search function: ${primaryResult.results?.length || 0} results`);
      return {
        results: primaryResult.results.map((product: any) => this.enhanceProductData(product)),
        cached: false
      };
    }
    
    // If we get here, the Zinc API failed - throw error for fallback handling
    const errorMessage = primaryResult?.error || 'Zinc API returned no results';
    console.log(`❌ [EnhancedZincApiService] Zinc API failed: ${errorMessage}`);
    throw new Error(`Zinc API search failed: ${errorMessage}`);
  }

  /**
   * Call zinc-search edge function with improved error handling
   */
  private async callZincSearchFunction(query: string, maxResults: number, filters?: any): Promise<any> {
    console.log(`🔧 [EnhancedZincApiService] Calling zinc-search function...`);
    
    try {
      const requestBody: any = {
        query,
        maxResults: maxResults.toString(),
        page: 1,
        filters: filters || {}
      };

      // Add price filters from filters or nicoleContext
      if (filters?.minPrice !== undefined) {
        requestBody.minPrice = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        requestBody.maxPrice = filters.maxPrice;
      }
      if (filters?.min_price !== undefined) {
        requestBody.minPrice = filters.min_price;
      }
      if (filters?.max_price !== undefined) {
        requestBody.maxPrice = filters.max_price;
      }

      console.log(`🔧 [EnhancedZincApiService] Request body:`, requestBody);

      const { data, error } = await supabase.functions.invoke('zinc-search', {
        body: requestBody
      });

      if (error) {
        console.error(`❌ [EnhancedZincApiService] zinc-search function error:`, error);
        return { error: `Zinc search function failed: ${error.message}` };
      }

      if (data?.error) {
        console.error(`❌ [EnhancedZincApiService] zinc-search returned error:`, data.error);
        return { error: data.error };
      }

      return data;
    } catch (invokeError) {
      console.error(`❌ [EnhancedZincApiService] zinc-search invoke error:`, invokeError);
      return { error: `Function invoke failed: ${invokeError.message}` };
    }
  }




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
   * Search for best selling products based on interest categories with balanced distribution
   */
  async searchBestSellingByInterests(categories: string[], limit: number = 20, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log(`Searching best selling products for categories: ${categories.join(', ')}, limit: ${limit}`);
    
    const bestSellingQuery = categories.map(cat => `best selling ${cat}`).join(' ');
    return this.searchProducts(bestSellingQuery, 1, limit, priceOptions);
  }

  /**
   * Search for best selling products by category using targeted queries
   */
  async searchBestSellingByCategory(category: string, limit: number = 20): Promise<ZincSearchResponse> {
    console.log(`Searching best selling products for category: ${category}`);
    
    const categoryQuery = CATEGORY_SEARCH_QUERIES[category as keyof typeof CATEGORY_SEARCH_QUERIES] || category;
    return this.searchProducts(categoryQuery, 1, limit);
  }

  /**
   * Get the search query for a specific category (for "See All" functionality)
   */
  getCategorySearchQuery(category: string): string {
    return CATEGORY_SEARCH_QUERIES[category as keyof typeof CATEGORY_SEARCH_QUERIES] || category;
  }

  /**
   * Search gifts for her categories
   */
  async searchGiftsForHerCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    return this.searchProducts('gifts for her skincare beauty fashion accessories', 1, limit, priceOptions);
  }

  /**
   * Search gifts for him categories
   */
  async searchGiftsForHimCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    return this.searchProducts('gifts for him tech gadgets electronics tools', 1, limit, priceOptions);
  }

  /**
   * Search gifts under $50 categories
   */
  async searchGiftsUnder50Categories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    const budgetOptions = {
      ...priceOptions,
      maxPrice: Math.min(priceOptions?.maxPrice || 50, 50)
    };
    return this.searchProducts('affordable gifts under 50 accessories tech books', 1, limit, budgetOptions);
  }

  /**
   * Search brand categories
   */
  async searchBrandCategories(brandName: string, limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    return this.searchProducts(brandName, 1, limit, priceOptions);
  }

  /**
   * Get default featured products (method required by other parts of the app)
   */
  async getDefaultProducts(limit: number = 20): Promise<ZincSearchResponse> {
    console.log(`Getting default featured products, limit: ${limit}`);
    
    const featuredQuery = "best selling popular trending featured products electronics home kitchen";
    return this.searchProducts(featuredQuery, 1, limit);
  }

  /**
   * Search luxury categories for high-end products
   */
  async searchLuxuryCategories(categories: string[], limit: number = 20): Promise<ZincSearchResponse> {
    console.log(`Searching luxury categories: ${categories.join(', ')}, limit: ${limit}`);
    
    const luxuryQuery = categories.map(cat => `luxury premium ${cat}`).join(' ');
    return this.searchProducts(luxuryQuery, 1, limit);
  }

  /**
   * Get detailed product information
   */
  async getProductDetail(productId: string): Promise<ZincProductDetail | null> {
    console.log(`Getting product detail for: ${productId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-product-detail', {
        body: { product_id: productId }
      });

      if (error) {
        console.error('Error getting product detail:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProductDetail:', error);
      return null;
    }
  }

  /**
   * Get detailed product information (alternative method name)
   */
  async getProductDetails(productId: string): Promise<ZincProductDetail | null> {
    return this.getProductDetail(productId);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    console.log('Clearing Enhanced Zinc API cache');
    this.cache.clear();
  }
}

// Export singleton instance
export const enhancedZincApiService = new EnhancedZincApiService();
