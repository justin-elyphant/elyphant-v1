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
  needsConfiguration?: boolean;
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
  toys: "toys games kids children educational fun entertainment play",
  // Missing categories that were causing "Failed to load products" errors
  "best-selling": "best selling top rated popular trending most bought bestseller",
  wedding: "wedding gifts bridal party engagement ceremony reception decorations invitations favors",
  baby: "baby gifts newborn infant toddler nursery toys clothes feeding"
};

class EnhancedZincApiService {
  private cache = new Map(); // Keep existing Map cache as primary layer

  /**
   * Search for best selling products based on interest categories with balanced distribution
   */
  async searchBestSellingByInterests(categories: string[], limit: number = 20, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log(`Searching best selling products for categories: ${categories.join(', ')}, limit: ${limit}`);
    
    try {
      // Create multiple "best selling" queries for different categories
      const bestSellingQueries = categories.map(category => `best selling ${category}`);
      console.log(`Generated queries: ${bestSellingQueries.join(', ')}`);
      
      // Calculate minimum products per category to ensure diversity
      const minProductsPerCategory = Math.max(3, Math.floor(limit / categories.length));
      const allResults: any[] = [];
      const resultsByCategory: Record<string, any[]> = {};
      
      // Execute searches for ALL categories (not just first 3)
      for (let i = 0; i < bestSellingQueries.length; i++) {
        const query = bestSellingQueries[i];
        const category = categories[i];
        
        console.log(`Searching best selling for category "${category}": "${query}"`);
        
        // Pass price filters to individual searches
        const filters = priceOptions ? {
          min_price: priceOptions.minPrice,
          max_price: priceOptions.maxPrice
        } : {};
        
        const response = await this.searchProducts(query, 1, minProductsPerCategory + 2, filters); // Get a few extra for filtering
        
        if (!response.error && response.results && response.results.length > 0) {
          resultsByCategory[category] = response.results;
          console.log(`Found ${response.results.length} products for category: ${category}`);
        } else {
          console.log(`No results for category: ${category}`);
          resultsByCategory[category] = [];
        }
      }
      
      // Implement round-robin distribution to ensure variety
      const finalResults: any[] = [];
      const usedProductIds = new Set<string>();
      
      // First pass: Get minimum products from each category
      for (const category of categories) {
        const categoryResults = resultsByCategory[category] || [];
        let addedFromCategory = 0;
        
        for (const product of categoryResults) {
          if (addedFromCategory >= minProductsPerCategory) break;
          if (usedProductIds.has(product.product_id)) continue;
          if (finalResults.length >= limit) break;
          
          finalResults.push(product);
          usedProductIds.add(product.product_id);
          addedFromCategory++;
        }
        
        console.log(`Added ${addedFromCategory} products from category: ${category}`);
      }
      
      // Second pass: Fill remaining slots with any available products
      if (finalResults.length < limit) {
        for (const category of categories) {
          const categoryResults = resultsByCategory[category] || [];
          
          for (const product of categoryResults) {
            if (finalResults.length >= limit) break;
            if (usedProductIds.has(product.product_id)) continue;
            
            finalResults.push(product);
            usedProductIds.add(product.product_id);
          }
        }
      }
      
      console.log(`Best selling search returned ${finalResults.length} balanced products across ${categories.length} categories`);
      
      // Log distribution for debugging
      const distribution: Record<string, number> = {};
      categories.forEach(category => {
        distribution[category] = (resultsByCategory[category] || []).filter(p => 
          finalResults.some(fp => fp.product_id === p.product_id)
        ).length;
      });
      console.log('Product distribution by category:', distribution);
      
      return {
        results: finalResults,
        error: finalResults.length === 0 ? 'No best selling products found' : undefined
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
   * Enhanced with Smart Query Optimization and Size-Aware Searching
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20, filters?: any): Promise<ZincSearchResponse> {
    console.log(`🎯 EnhancedZincApiService: Searching products: "${query}", page: ${page}, limit: ${limit}, filters:`, filters);
    
    // Import smart query enhancement
    const { enhanceQueryForSizes } = await import("@/services/smartQueryEnhancer");
    const { detectCategoryFromSearch } = await import("@/components/marketplace/utils/smartFilterDetection");
    
    // Phase 1: Enhanced Query Strategy - Analyze query for size-aware enhancement
    const queryEnhancement = enhanceQueryForSizes(query);
    const detectedCategory = detectCategoryFromSearch(query);
    
    console.log(`🎯 Query Enhancement:`, queryEnhancement);
    console.log(`🎯 Detected Category:`, detectedCategory);
    
    // Generate cache key for enhanced caching
    const cacheKey = `search_${query}_${page}_${limit}_${JSON.stringify(filters || {})}`;
    
    // Check existing Map cache first (preserving existing cache as primary layer)
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < 30 * 60 * 1000) { // 30 minute TTL
      console.log(`🎯 Cache HIT (Map): ${cacheKey}`);
      return {
        results: cachedResult.data,
        cached: true
      };
    }
    
    // Special handling for category searches
    if (query === "category=best-selling" || query.includes("best-selling")) {
      console.log('🎯 Detected best-selling category search, using specialized search');
      const priceOptions = filters ? {
        minPrice: filters.minPrice || filters.min_price,
        maxPrice: filters.maxPrice || filters.max_price
      } : undefined;
      return this.searchBestSellingCategories(limit, priceOptions);
    }
    
    if (query === "category=electronics" || query.includes("electronics")) {
      console.log('🎯 Detected electronics category search, using specialized search');
      const priceOptions = filters ? {
        minPrice: filters.minPrice || filters.min_price,
        maxPrice: filters.maxPrice || filters.max_price
      } : undefined;
      return this.searchElectronicsCategories(limit, priceOptions);
    }
    
    try {
      // Phase 1: Use enhanced query if search strategy suggests it
      let finalQuery = query;
      let finalLimit = limit;
      
      // Re-enabled smart enhancement with gender bias fix
      if (queryEnhancement.searchStrategy === 'multi-size' && detectedCategory === 'clothing') {
        // Use smart query selection: prefer original for gender inclusivity, but enhance for size variety
        const enhancedQuery = queryEnhancement.enhancedQueries.find(q => 
          q.includes('various') || q.includes('sizes')
        ) || queryEnhancement.enhancedQueries[0]; // Fallback to original query
        
        finalQuery = enhancedQuery;
        finalLimit = Math.min(limit * 1.2, 60); // Moderate increase for better size variety
        console.log(`🎯 Using gender-neutral enhanced query: "${finalQuery}" with limit: ${finalLimit}`);
        console.log(`🎯 Original query was: "${query}"`);
        console.log(`🎯 Available enhanced queries:`, queryEnhancement.enhancedQueries);
      } else {
        console.log(`🎯 Using original query (no enhancement needed): "${query}"`);
      }

      // CRITICAL FIX: Ensure price filters are properly formatted for the edge function
      const requestBody: any = {
        query: finalQuery,
        page,
        limit: finalLimit,
        filters: filters || {},
        // Add smart search metadata
        smartSearchMeta: {
          originalQuery: query,
          enhancement: queryEnhancement.searchStrategy,
          expectedSizeTypes: queryEnhancement.expectedSizeTypes,
          detectedCategory,
          // Include filter awareness for enhanced search
          hasAdvancedFilters: !!(filters?.waist?.length || filters?.inseam?.length || 
                                 filters?.size?.length || filters?.brand?.length || 
                                 filters?.color?.length || filters?.material?.length || 
                                 filters?.style?.length || filters?.features?.length)
        }
      };

      // Add price filters directly to the request body for edge function compatibility
      if (filters?.minPrice !== undefined) {
        requestBody.filters.minPrice = filters.minPrice;
        requestBody.filters.min_price = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        requestBody.filters.maxPrice = filters.maxPrice;
        requestBody.filters.max_price = filters.maxPrice;
      }
      if (filters?.min_price !== undefined) {
        requestBody.filters.min_price = filters.min_price;
        requestBody.filters.minPrice = filters.min_price;
      }
      if (filters?.max_price !== undefined) {
        requestBody.filters.max_price = filters.max_price;
        requestBody.filters.maxPrice = filters.max_price;
      }

      console.log(`🎯 FIXED: Sending request body with price filters:`, requestBody);

      const { data, error } = await supabase.functions.invoke('get-products', {
        body: requestBody
      });

      if (error) {
        console.error('Error calling get-products function:', error);
        
        // Check if it's a configuration issue (503)
        if (error.message?.includes('503') || error.message?.includes('not configured')) {
          console.warn('⚠️  Product search not configured - API key missing');
          return {
            results: [],
            error: 'Product search temporarily unavailable. Please configure ZINC_API_KEY.',
            needsConfiguration: true
          };
        }
        
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
      let enhancedResults = data.results.map((product: any) => this.enhanceProductData(product));

      // Debug logging for gender detection issue
      console.log(`🔍 API Search Results for "${finalQuery}":`, {
        totalResults: enhancedResults.length,
        sampleTitles: enhancedResults.slice(0, 3).map(p => p.title),
        allTitles: enhancedResults.map(p => p.title)
      });

      // Phase 2: Apply smart filtering if we got more results than requested
      if (enhancedResults.length > limit && queryEnhancement.searchStrategy === 'multi-size') {
        // Smart product selection for better size distribution
        enhancedResults = await this.smartFilterForSizeDistribution(enhancedResults, limit, queryEnhancement.expectedSizeTypes);
        console.log(`🎯 Applied smart size distribution filtering: ${enhancedResults.length} products selected`);
      }

      // Cache successful results in Map cache (enhanced with cache key and metadata)
      if (enhancedResults && enhancedResults.length > 0) {
        this.cache.set(cacheKey, {
          data: enhancedResults,
          timestamp: Date.now(),
          smartMeta: {
            originalQuery: query,
            enhancement: queryEnhancement.searchStrategy,
            detectedCategory,
            sizeTypes: queryEnhancement.expectedSizeTypes
          }
        });
      }

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
   * NEW: Smart filtering for better size distribution
   */
  private async smartFilterForSizeDistribution(products: any[], targetCount: number, expectedSizeTypes: string[]): Promise<any[]> {
    const { extractAdvancedSizes } = await import("@/utils/advancedSizeDetection");
    
    // If we don't need size filtering, return first N products
    if (expectedSizeTypes.length === 0) {
      return products.slice(0, targetCount);
    }

    // Group products by detected sizes
    const sizeGroups = new Map<string, any[]>();
    const productsWithSizes: any[] = [];
    const productsWithoutSizes: any[] = [];

    products.forEach(product => {
      const text = `${product.title || ''} ${product.description || ''}`;
      const sizes = extractAdvancedSizes([product]);
      
      let hasSizes = false;
      
      // Check if product has sizes in expected types
      expectedSizeTypes.forEach(sizeType => {
        if (sizes[sizeType as keyof typeof sizes].length > 0) {
          sizes[sizeType as keyof typeof sizes].forEach(size => {
            const key = `${sizeType}_${size}`;
            if (!sizeGroups.has(key)) {
              sizeGroups.set(key, []);
            }
            sizeGroups.get(key)!.push(product);
            hasSizes = true;
          });
        }
      });

      if (hasSizes) {
        productsWithSizes.push(product);
      } else {
        productsWithoutSizes.push(product);
      }
    });

    // Smart selection: ensure size diversity
    const selectedProducts: any[] = [];
    const usedProductIds = new Set<string>();
    
    // First pass: Get one product from each size group
    Array.from(sizeGroups.values()).forEach(group => {
      if (selectedProducts.length < targetCount && group.length > 0) {
        const product = group[0];
        if (!usedProductIds.has(product.product_id)) {
          selectedProducts.push(product);
          usedProductIds.add(product.product_id);
        }
      }
    });

    // Second pass: Fill remaining spots with products with sizes
    productsWithSizes.forEach(product => {
      if (selectedProducts.length < targetCount && !usedProductIds.has(product.product_id)) {
        selectedProducts.push(product);
        usedProductIds.add(product.product_id);
      }
    });

    // Third pass: Fill any remaining spots with products without detected sizes
    productsWithoutSizes.forEach(product => {
      if (selectedProducts.length < targetCount && !usedProductIds.has(product.product_id)) {
        selectedProducts.push(product);
        usedProductIds.add(product.product_id);
      }
    });

    console.log(`🎯 Size distribution: ${sizeGroups.size} unique sizes found, ${selectedProducts.length} products selected`);
    return selectedProducts;
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
  async searchGiftsForHerCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Starting gifts for her category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          giftsForHer: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
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
  async searchGiftsForHimCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Starting gifts for him category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          giftsForHim: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
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
  async searchGiftsUnder50Categories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Starting gifts under $50 category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query: 'gifts under $50 categories', // Required by edge function
          giftsUnder50: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
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
   * Search best selling categories and return diverse product array
   */
  async searchBestSellingCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Starting best selling category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          bestSelling: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
        }
      });

      if (error) {
        console.error('Error in best selling category search:', error);
        return {
          results: [],
          error: error.message || 'Failed to search best selling categories',
          cached: false
        };
      }

      console.log(`Best selling categories search complete: ${data?.results?.length || 0} products returned`);
      
      return {
        results: data?.results || [],
        cached: false
      };
    } catch (error) {
      console.error('Exception in best selling category search:', error);
      return {
        results: [],
        error: 'Failed to search best selling categories',
        cached: false
      };
    }
  }

  /**
   * Search electronics categories and return diverse product array
   */
  async searchElectronicsCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Starting electronics category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          electronics: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
        }
      });

      if (error) {
        console.error('Error in electronics category search:', error);
        return {
          results: [],
          error: error.message || 'Failed to search electronics categories',
          cached: false
        };
      }

      console.log(`Electronics categories search complete: ${data?.results?.length || 0} products returned`);
      
      return {
        results: data?.results || [],
        cached: false
      };
    } catch (error) {
      console.error('Exception in electronics category search:', error);
      return {
        results: [],
        error: 'Failed to search electronics categories',
        cached: false
      };
    }
  }


  /**
   * Search brand categories and return diverse product array across all brand categories
   */
  async searchBrandCategories(brandName: string, limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log(`Starting brand category search for: ${brandName}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          query: brandName,
          brandCategories: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
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
  async searchLuxuryCategories(limit: number = 16, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Starting luxury category search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: {
          luxuryCategories: true,
          limit,
          filters: priceOptions ? {
            min_price: priceOptions.minPrice,
            max_price: priceOptions.maxPrice
          } : {}
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
  async getDefaultProducts(limit: number = 20, priceOptions?: { minPrice?: number; maxPrice?: number }): Promise<ZincSearchResponse> {
    console.log('Loading default marketplace products...');
    
    try {
      // Search for best selling gifts as default products
      const filters = priceOptions ? {
        min_price: priceOptions.minPrice,
        max_price: priceOptions.maxPrice
      } : {};
      const response = await this.searchProducts('best selling gifts', 1, limit, filters);
      
      if (response.results && response.results.length > 0) {
        console.log(`Loaded ${response.results.length} default products`);
        return response;
      }
      
      // Fallback to popular categories if no best sellers found
      console.log('No best sellers found, trying popular categories...');
      const fallbackResponse = await this.searchProducts('popular gifts', 1, limit, filters);
      
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
