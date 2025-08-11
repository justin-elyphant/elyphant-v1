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

class EnhancedZincApiService {
  private cache = new Map();

  /**
   * Search for best selling products based on interest categories
   */
  async searchBestSellingByInterests(categories: string[], limit: number = 20): Promise<ZincSearchResponse> {
    console.log(`Searching best selling products for categories: ${categories.join(', ')}, limit: ${limit}`);
    
    try {
      // Create multiple "best selling" queries for different categories
      const bestSellingQueries = categories.map(category => `best selling ${category}`);
      const allResults: any[] = [];
      
      // Execute searches for each category
      for (const query of bestSellingQueries.slice(0, 3)) { // Limit to 3 categories to avoid too many API calls
        console.log(`Searching best selling for: "${query}"`);
        
        const response = await this.searchProducts(query, 1, Math.ceil(limit / bestSellingQueries.length));
        
        if (!response.error && response.results) {
          allResults.push(...response.results);
        }
      }
      
      // Remove duplicates and limit results
      const uniqueResults = allResults.filter((product, index, self) => 
        index === self.findIndex(p => p.product_id === product.product_id)
      ).slice(0, limit);
      
      console.log(`Best selling search returned ${uniqueResults.length} unique products`);
      
      return {
        results: uniqueResults,
        error: uniqueResults.length === 0 ? 'No best selling products found' : undefined
      };
      
    } catch (error) {
      console.error('Error searching best selling by interests:', error);
      return {
        results: [],
        error: `Best selling search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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
   * NEW: Search for best selling products by category using targeted queries
   */
  async searchBestSellingByCategory(category: string, limit: number = 20): Promise<ZincSearchResponse> {
    console.log(`Searching best selling products for category: ${category}`);
    
    const categoryQuery = CATEGORY_SEARCH_QUERIES[category as keyof typeof CATEGORY_SEARCH_QUERIES];
    
    if (!categoryQuery) {
      console.warn(`No category query found for: ${category}`);
      return {
        results: [],
        error: `Unknown category: ${category}`
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query: categoryQuery,
          page: 1,
          limit,
          filters: {
            category: category,
            best_sellers_only: true
          }
        }
      });

      if (error) {
        console.error(`Error calling get-products for category ${category}:`, error);
        return {
          results: [],
          error: `Category search failed: ${error.message}`
        };
      }

      if (!data || !data.results) {
        console.warn(`No products returned for category ${category}`);
        return {
          results: [],
          error: `No products found for ${category}`
        };
      }

      // Enhance product data with best seller information
      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      console.log(`Found ${enhancedResults.length} best selling products for category: ${category}`);

      return {
        results: enhancedResults || [],
        cached: false
      };

    } catch (error) {
      console.error(`Category search error for ${category}:`, error);
      return {
        results: [],
        error: error instanceof Error ? error.message : `Search failed for ${category}`
      };
    }
  }

  /**
   * NEW: Get the search query for a specific category (for "See All" functionality)
   */
  getCategorySearchQuery(category: string): string {
    return CATEGORY_SEARCH_QUERIES[category as keyof typeof CATEGORY_SEARCH_QUERIES] || category;
  }

  /**
   * Search gifts for her categories and return diverse product array
   */
  async searchGiftsForHerCategories(limit: number = 16): Promise<ZincSearchResponse> {
    console.log('Starting gifts for her category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          giftsForHer: true,
          limit
        }
      });

      if (error) {
        console.error('Error calling gifts for her category search:', error);
        return this.searchProducts('skincare essentials for women', 1, limit);
      }

      if (!data || !data.results) {
        console.warn('No gifts for her products returned, using fallback');
        return this.searchProducts('skincare essentials for women', 1, limit);
      }

      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      console.log(`Gifts for her category search complete: ${enhancedResults.length} products from multiple categories`);

      return {
        results: enhancedResults || [],
        cached: false
      };

    } catch (error) {
      console.error('Gifts for her category search error:', error);
      return this.searchProducts('skincare essentials for women', 1, limit);
    }
  }

  /**
   * Search gifts for him categories and return diverse product array
   */
  async searchGiftsForHimCategories(limit: number = 16): Promise<ZincSearchResponse> {
    console.log('Starting gifts for him category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          giftsForHim: true,
          limit
        }
      });

      if (error) {
        console.error('Error calling gifts for him category search:', error);
        return this.searchProducts('tech gadgets for men', 1, limit);
      }

      if (!data || !data.results) {
        console.warn('No gifts for him products returned, using fallback');
        return this.searchProducts('tech gadgets for men', 1, limit);
      }

      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      console.log(`Gifts for him category search complete: ${enhancedResults.length} products from multiple categories`);

      return {
        results: enhancedResults || [],
        cached: false
      };

    } catch (error) {
      console.error('Gifts for him category search error:', error);
      return this.searchProducts('tech gadgets for men', 1, limit);
    }
  }

  /**
   * Search gifts under $50 categories and return diverse product array
   */
  async searchGiftsUnder50Categories(limit: number = 16): Promise<ZincSearchResponse> {
    console.log('Starting gifts under $50 category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query: 'gifts under $50 categories', // Required by edge function
          giftsUnder50: true,
          limit
        }
      });

      if (error) {
        console.error('Error calling gifts under $50 category search:', error);
        return this.searchProducts('affordable tech accessories', 1, limit);
      }

      if (!data || !data.results) {
        console.warn('No gifts under $50 products returned, using fallback');
        return this.searchProducts('affordable tech accessories', 1, limit);
      }

      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      console.log(`Gifts under $50 category search complete: ${enhancedResults.length} products from multiple categories`);

      return {
        results: enhancedResults || [],
        cached: false
      };

    } catch (error) {
      console.error('Gifts under $50 category search error:', error);
      return this.searchProducts('affordable tech accessories', 1, limit);
    }
  }

  /**
   * Search brand categories and return diverse product array across all brand categories
   */
  async searchBrandCategories(brandName: string, limit: number = 16): Promise<ZincSearchResponse> {
    console.log(`Starting brand category search for: ${brandName}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query: brandName,
          brandCategories: true,
          limit
        }
      });

      if (error) {
        console.error(`Error calling brand category search for ${brandName}:`, error);
        return this.searchProducts(brandName, 1, limit);
      }

      if (!data || !data.results) {
        console.warn(`No brand products returned for ${brandName}, using fallback`);
        return this.searchProducts(brandName, 1, limit);
      }

      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      console.log(`Brand category search complete for ${brandName}: ${enhancedResults.length} products from multiple categories`);

      return {
        results: enhancedResults || [],
        cached: false
      };

    } catch (error) {
      console.error(`Brand category search error for ${brandName}:`, error);
      return this.searchProducts(brandName, 1, limit);
    }
  }

  /**
   * Search luxury categories and return diverse product array
   */
  async searchLuxuryCategories(limit: number = 16): Promise<ZincSearchResponse> {
    console.log('Starting luxury category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          luxuryCategories: true,
          limit
        }
      });

      if (error) {
        console.error('Error calling luxury category search:', error);
        // Fallback to single luxury search
        return this.searchProducts('top designer bags for women', 1, limit);
      }

      if (!data || !data.results) {
        console.warn('No luxury products returned, using fallback');
        return this.searchProducts('top designer bags for women', 1, limit);
      }

      // Enhance luxury product data
      const enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      console.log(`Luxury category search complete: ${enhancedResults.length} products from multiple categories`);

      return {
        results: enhancedResults || [],
        cached: false
      };

    } catch (error) {
      console.error('Luxury category search error:', error);
      // Fallback to single luxury search
      return this.searchProducts('top designer bags for women', 1, limit);
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
