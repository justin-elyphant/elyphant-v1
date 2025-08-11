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
   * Main search method with comprehensive Nicole-aware fallback logic
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20, filters?: any): Promise<ZincSearchResponse> {
    console.log(`🔍 [EnhancedZincApiService] Starting search for: "${query}", page: ${page}, limit: ${limit}, filters:`, filters);
    
    try {
      // **PRIMARY: Try zinc-search edge function first with better error handling**
      try {
        const primaryResult = await this.callZincSearchFunction(query, limit, filters);
        
        if (primaryResult && !primaryResult.error && primaryResult.results?.length > 0) {
          console.log(`✅ [EnhancedZincApiService] SUCCESS with zinc-search function: ${primaryResult.results?.length || 0} results`);
          return {
            results: primaryResult.results.map((product: any) => this.enhanceProductData(product)),
            cached: false
          };
        }
        
        console.log(`⚠️ [EnhancedZincApiService] zinc-search returned no results or error:`, primaryResult?.error);
      } catch (zincError) {
        console.log(`⚠️ [EnhancedZincApiService] zinc-search failed with error:`, zincError.message);
      }
      
      // **FALLBACK: Generate Nicole-aware mock data immediately**
      console.log(`🔄 [EnhancedZincApiService] Using Nicole-aware mock data for query: "${query}"`);
      const mockResults = this.generateNicoleAwareMockResults(query, filters);
      
      return {
        results: mockResults,
        cached: false,
        error: 'API temporarily unavailable - showing relevant recommendations'
      };
      
    } catch (error) {
      console.error(`❌ [EnhancedZincApiService] Complete failure:`, error);
      
      // **FINAL FALLBACK: Basic mock data**
      const basicMockResults = this.generateBasicMockResults(query);
      
      return {
        results: basicMockResults,
        cached: false,
        error: `Search failed: ${error.message}`
      };
    }
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
   * Generate Nicole-aware mock results that respect budget and interests
   */
  private generateNicoleAwareMockResults(query: string, filters?: any): any[] {
    console.log(`🎭 [EnhancedZincApiService] Generating Nicole-aware mock results for: "${query}"`);
    console.log(`🎭 [EnhancedZincApiService] Filters:`, filters);
    
    // Extract budget from filters (could be from Nicole context)
    const minPrice = filters?.minPrice || filters?.min_price || 10;
    const maxPrice = filters?.maxPrice || filters?.max_price || 500;
    const budget: [number, number] = [minPrice, maxPrice];
    
    // Extract interests from query
    const queryLower = query.toLowerCase();
    const detectedInterests = [];
    
    if (queryLower.includes('concert') || queryLower.includes('music')) detectedInterests.push('concerts');
    if (queryLower.includes('cooking') || queryLower.includes('kitchen')) detectedInterests.push('cooking');
    if (queryLower.includes('netflix') || queryLower.includes('movie') || queryLower.includes('tv')) detectedInterests.push('entertainment');
    if (queryLower.includes('gift')) detectedInterests.push('gifts');
    if (queryLower.includes('tech') || queryLower.includes('electronic')) detectedInterests.push('tech');
    if (queryLower.includes('book')) detectedInterests.push('books');
    if (queryLower.includes('fashion') || queryLower.includes('clothing')) detectedInterests.push('fashion');
    
    console.log(`🎭 [EnhancedZincApiService] Detected interests: ${detectedInterests.join(', ')}`);
    console.log(`🎭 [EnhancedZincApiService] Budget: $${budget[0]}-$${budget[1]}`);
    
    // Generate budget-appropriate mock products
    const mockProducts = this.generateBudgetAppropriateProducts(query, budget, detectedInterests);
    
    console.log(`🎭 [EnhancedZincApiService] Generated ${mockProducts.length} Nicole-aware mock products`);
    return mockProducts;
  }

  /**
   * Generate budget-appropriate products based on context
   */
  private generateBudgetAppropriateProducts(query: string, budget: [number, number], interests: string[]): any[] {
    const [minPrice, maxPrice] = budget;
    
    // Base products categorized by interest
    const productTemplates = {
      concerts: [
        {
          title: "Premium Bluetooth Concert Headphones",
          basePrice: 89.99,
          category: "Electronics",
          description: "High-quality wireless headphones perfect for music lovers and concert enthusiasts"
        },
        {
          title: "Concert Poster Frame Set",
          basePrice: 34.99,
          category: "Home & Garden",
          description: "Stylish frames for displaying concert posters and memorabilia"
        },
        {
          title: "Portable Bluetooth Speaker for Music",
          basePrice: 69.99,
          category: "Electronics",
          description: "Compact speaker with amazing sound quality for music on the go"
        }
      ],
      cooking: [
        {
          title: "Professional Chef's Knife Set",
          basePrice: 129.99,
          category: "Kitchen",
          description: "Premium stainless steel knife set for serious home cooking"
        },
        {
          title: "Non-Stick Cooking Pan Set",
          basePrice: 79.99,
          category: "Kitchen",
          description: "Professional-grade non-stick cookware for everyday cooking"
        },
        {
          title: "Digital Kitchen Scale",
          basePrice: 39.99,
          category: "Kitchen",
          description: "Precise measurements for perfect cooking and baking results"
        }
      ],
      entertainment: [
        {
          title: "Smart TV Streaming Device",
          basePrice: 149.99,
          category: "Electronics",
          description: "4K streaming device perfect for Netflix and entertainment"
        },
        {
          title: "Cozy Throw Blanket for Movie Nights",
          basePrice: 39.99,
          category: "Home & Garden",
          description: "Ultra-soft blanket perfect for binge-watching sessions"
        },
        {
          title: "Wireless Gaming Controller",
          basePrice: 89.99,
          category: "Electronics",
          description: "Premium controller for console and streaming entertainment"
        }
      ],
      gifts: [
        {
          title: "Luxury Gift Box Set",
          basePrice: 99.99,
          category: "Gifts",
          description: "Beautifully curated gift set perfect for any occasion"
        },
        {
          title: "Personalized Photo Album",
          basePrice: 49.99,
          category: "Gifts",
          description: "Custom photo album for preserving special memories"
        },
        {
          title: "Artisan Candle Collection",
          basePrice: 59.99,
          category: "Gifts",
          description: "Hand-poured candles with luxurious scents"
        }
      ],
      tech: [
        {
          title: "Wireless Charging Pad",
          basePrice: 45.99,
          category: "Electronics",
          description: "Fast wireless charging for all compatible devices"
        },
        {
          title: "Smart Watch Fitness Tracker",
          basePrice: 199.99,
          category: "Electronics",
          description: "Advanced fitness tracking with smart notifications"
        }
      ],
      books: [
        {
          title: "Best Selling Novel Collection",
          basePrice: 29.99,
          category: "Books",
          description: "Collection of current bestselling novels"
        },
        {
          title: "Premium Reading Light",
          basePrice: 49.99,
          category: "Electronics",
          description: "Adjustable LED reading light for comfortable reading"
        }
      ],
      fashion: [
        {
          title: "Stylish Fashion Accessory Set",
          basePrice: 79.99,
          category: "Fashion",
          description: "Trendy accessories to complement any outfit"
        },
        {
          title: "Premium Quality Scarf",
          basePrice: 59.99,
          category: "Fashion",
          description: "Soft, luxurious scarf in trending colors"
        }
      ]
    };

    // Collect relevant products based on interests
    let relevantProducts: any[] = [];
    
    // Add products for detected interests
    interests.forEach(interest => {
      if (productTemplates[interest]) {
        relevantProducts.push(...productTemplates[interest]);
      }
    });
    
    // If no specific interests detected, add a mix
    if (relevantProducts.length === 0) {
      relevantProducts = [
        ...productTemplates.gifts.slice(0, 2),
        ...productTemplates.tech.slice(0, 2),
        ...productTemplates.entertainment.slice(0, 2)
      ];
    }

    // Convert to final product format with budget-appropriate pricing
    const finalProducts = relevantProducts
      .map((template, index) => {
        // Adjust price to fit budget
        let adjustedPrice = template.basePrice;
        if (adjustedPrice < minPrice) {
          adjustedPrice = minPrice + (Math.random() * 20); // Add some variation above minimum
        }
        if (adjustedPrice > maxPrice) {
          adjustedPrice = maxPrice - (Math.random() * 20); // Subtract some variation below maximum
        }
        
        // Ensure price is within budget
        adjustedPrice = Math.max(minPrice, Math.min(maxPrice, adjustedPrice));
        
        return {
          product_id: `nicole-aware-${Date.now()}-${index}`,
          title: template.title,
          price: Math.round(adjustedPrice * 100) / 100,
          description: template.description,
          image: '/placeholder.svg',
          images: ['/placeholder.svg'],
          category: template.category,
          retailer: 'Nicole Recommendations',
          rating: 4.2 + (Math.random() * 0.8),
          review_count: Math.floor(Math.random() * 1000) + 100,
          url: '#',
          brand: 'Premium Brand',
          availability: 'in_stock',
          nicoleMatch: {
            budgetMatch: true,
            interestMatch: interests.some(interest => 
              template.title.toLowerCase().includes(interest) ||
              template.description.toLowerCase().includes(interest)
            )
          }
        };
      })
      .filter(product => product.price >= minPrice && product.price <= maxPrice);

    // Add generic products if we have fewer than 6
    while (finalProducts.length < 6) {
      const genericPrice = minPrice + (Math.random() * (maxPrice - minPrice));
      finalProducts.push({
        product_id: `nicole-generic-${Date.now()}-${finalProducts.length}`,
        title: `Quality Product ${finalProducts.length + 1}`,
        price: Math.round(genericPrice * 100) / 100,
        description: `A great product that fits your budget of $${minPrice}-$${maxPrice}`,
        image: '/placeholder.svg',
        images: ['/placeholder.svg'],
        category: 'General',
        retailer: 'Nicole Recommendations',
        rating: 4.0 + (Math.random() * 1.0),
        review_count: Math.floor(Math.random() * 500) + 50,
        url: '#',
        brand: 'Quality Brand',
        availability: 'in_stock',
        nicoleMatch: {
          budgetMatch: true,
          interestMatch: false
        }
      });
    }

    return finalProducts.slice(0, 8); // Return up to 8 products
  }

  /**
   * Generate basic mock results (final fallback)
   */
  private generateBasicMockResults(query: string): any[] {
    const basicProducts = [
      {
        product_id: `basic-${Date.now()}-1`,
        title: `Search Results for "${query}"`,
        price: 49.99,
        description: `Products related to your search for ${query}`,
        image: '/placeholder.svg',
        images: ['/placeholder.svg'],
        category: 'General',
        retailer: 'Basic Store',
        rating: 4.0,
        review_count: 100,
        url: '#',
        brand: 'Generic Brand',
        availability: 'in_stock'
      }
    ];

    return basicProducts;
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
