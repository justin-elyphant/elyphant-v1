// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client for cache operations
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found, cache enrichment disabled');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Get Zinc API key from environment variables (unified approach)
 */
const getZincApiKey = () => {
  const apiKey = Deno.env.get('ZINC_API_KEY');
  
  if (!apiKey) {
    console.error('❌ ZINC_API_KEY not found in environment variables');
    return null;
  }
  
  console.log('✅ Zinc API key loaded from environment');
  return apiKey;
};

/**
 * Enrich search results with cached product data (ratings, reviews, images)
 * This is the core of our cache-first strategy for cost savings
 */
const enrichWithCachedData = async (supabase: any, products: any[]) => {
  if (!supabase || !products || products.length === 0) {
    return { products, cacheHits: 0, cacheMisses: products?.length || 0 };
  }

  const productIds = products.map(p => p.product_id || p.asin).filter(Boolean);
  
  if (productIds.length === 0) {
    return { products, cacheHits: 0, cacheMisses: products.length };
  }

  try {
    console.log(`🔍 Checking cache for ${productIds.length} products...`);
    
    const { data: cachedProducts, error } = await supabase
      .from('products')
      .select('product_id, metadata, view_count, last_refreshed_at')
      .in('product_id', productIds);

    if (error) {
      console.error('❌ Cache query failed:', error.message);
      return { products, cacheHits: 0, cacheMisses: products.length };
    }

    // Create lookup map for fast access
    const cacheMap = new Map();
    (cachedProducts || []).forEach((cached: any) => {
      cacheMap.set(cached.product_id, cached);
    });

    let cacheHits = 0;
    let cacheMisses = 0;

    // Enrich products with cached data
    const enrichedProducts = products.map(product => {
      const productId = product.product_id || product.asin;
      const cached = cacheMap.get(productId);

      if (cached && cached.metadata) {
        cacheHits++;
        const metadata = cached.metadata;
        
        return {
          ...product,
          // Enrich with cached rating data
          stars: metadata.stars || product.stars,
          review_count: metadata.review_count || product.review_count,
          // Enrich with cached images if available
          images: metadata.images || product.images,
          main_image: metadata.main_image || product.main_image || product.image,
          // Add cache metadata for smart sorting
          is_cached: true,
          view_count: cached.view_count || 0,
          // Calculate popularity score for sorting
          popularity_score: calculatePopularityScore(cached, metadata)
        };
      } else {
        cacheMisses++;
        return {
          ...product,
          is_cached: false,
          view_count: 0,
          popularity_score: 0
        };
      }
    });

    console.log(`✅ Cache enrichment: ${cacheHits} hits, ${cacheMisses} misses (${Math.round(cacheHits / products.length * 100)}% hit rate)`);
    
    return { products: enrichedProducts, cacheHits, cacheMisses };
  } catch (error) {
    console.error('❌ Cache enrichment error:', error);
    return { products, cacheHits: 0, cacheMisses: products.length };
  }
};

/**
 * Cache search results in products table for future queries
 * Uses background write to not block response - this is the key to Nicole's organic growth strategy
 */
const cacheSearchResults = async (supabase: any, products: any[], sourceQuery?: string) => {
  if (!supabase || !products || products.length === 0) return;

  try {
    const productsToCache = products.map(p => ({
      product_id: p.product_id || p.asin,
      title: p.title,
      price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || null,
      image_url: p.main_image || p.image || p.thumbnail,
      retailer: 'amazon',
      brand: p.brand || null,
      category: p.category || p.categories?.[0] || null,
      last_refreshed_at: new Date().toISOString(),
      metadata: {
        stars: p.stars || p.rating || null,
        review_count: p.review_count || p.num_reviews || null,
        main_image: p.main_image || p.image,
        images: p.images || [p.main_image || p.image].filter(Boolean),
        isBestSeller: p.isBestSeller || false,
        bestSellerType: p.bestSellerType || null,
        badgeText: p.badgeText || null,
        source: 'search_results',
        source_query: sourceQuery || null,
        cached_at: new Date().toISOString()
      }
    })).filter(p => p.product_id);

    if (productsToCache.length === 0) return;

    const { error } = await supabase
      .from('products')
      .upsert(productsToCache, { 
        onConflict: 'product_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Failed to cache search results:', error.message);
    } else {
      console.log(`✅ Cached ${productsToCache.length} search result products for query: "${sourceQuery || 'category'}"`);
    }
  } catch (error) {
    console.warn('⚠️ Search result caching failed:', error);
  }
};

/**
 * Check if we have enough cached products for a query (cache-first lookup)
 * Returns cached products if sufficient, null otherwise
 */
const getCachedProductsForQuery = async (supabase: any, query: string, limit: number) => {
  if (!supabase || !query || query.length < 2) return null;

  try {
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length >= 3);
    
    if (searchTerms.length === 0) return null;

    // Try to find products matching the query
    // Use ilike for flexible matching
    let queryBuilder = supabase
      .from('products')
      .select('*')
      .not('metadata', 'is', null);

    // Build OR condition for search terms matching title
    const orConditions = searchTerms.map(term => `title.ilike.%${term}%`).join(',');
    
    const { data: cachedProducts, error } = await supabase
      .from('products')
      .select('*')
      .or(orConditions)
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('❌ Cache lookup failed:', error.message);
      return null;
    }

    // Only return cache if we have at least 80% of requested products
    const threshold = Math.ceil(limit * 0.8);
    if (cachedProducts && cachedProducts.length >= threshold) {
      console.log(`✅ Cache HIT: Found ${cachedProducts.length} cached products for "${query}" (threshold: ${threshold})`);
      
      // Transform cached products to match Zinc response format
      return cachedProducts.map((p: any) => ({
        product_id: p.product_id,
        asin: p.product_id,
        title: p.title,
        price: p.price,
        image: p.image_url,
        main_image: p.metadata?.main_image || p.image_url,
        images: p.metadata?.images || [p.image_url],
        brand: p.brand,
        category: p.category,
        stars: p.metadata?.stars,
        rating: p.metadata?.stars,
        review_count: p.metadata?.review_count,
        num_reviews: p.metadata?.review_count,
        isBestSeller: p.metadata?.isBestSeller || false,
        bestSellerType: p.metadata?.bestSellerType,
        badgeText: p.metadata?.badgeText,
        is_cached: true,
        view_count: p.view_count || 0,
        popularity_score: calculatePopularityScore(p, p.metadata || {}),
        from_cache: true // Flag to indicate this came from DB cache
      }));
    }

    console.log(`⏳ Cache MISS: Only ${cachedProducts?.length || 0} products for "${query}" (need ${threshold})`);
    return null;
  } catch (error) {
    console.warn('⚠️ Cache lookup error:', error);
    return null;
  }
};

/**
 * Calculate popularity score for smart sorting
 * Higher scores = cached products with good data float to top
 * 
 * Score breakdown (max ~210 points):
 * - Best Seller badges: up to 60 points
 * - View count: up to 50 points
 * - Has ratings: 50 points
 * - High ratings (4+ stars): up to 25 points
 * - Review count: up to 25 points
 */
const calculatePopularityScore = (cached: any, metadata: any) => {
  let score = 0;
  
  // BASELINE BONUS: Cached products get priority positioning
  // Ensures viewed/cached products rank above fresh non-cached results
  if (cached.view_count !== undefined || cached.product_id) {
    score += 20;
  }
  
  // Best Seller badge bonuses (highest priority - Amazon's curated signals)
  // Handle both camelCase and snake_case field names for compatibility
  const bestSellerType = metadata.bestSellerType || metadata.best_seller_type || 
                         metadata.badgeText || metadata.badge_text || '';
  const isBestSeller = metadata.isBestSeller || metadata.is_best_seller || false;
  
  // Check raw num_sales field from Zinc API (critical for high-volume products)
  const numSales = metadata.num_sales || cached.num_sales || 0;
  if (numSales > 1000) {
    score += 50; // Best seller bonus for high sales volume
  } else if (numSales > 500) {
    score += 30; // Popular bonus for moderate sales
  }
  
  if (bestSellerType) {
    const badgeLower = bestSellerType.toLowerCase();
    if (badgeLower.includes("amazon's choice") || badgeLower.includes("amazons choice")) {
      score += 60; // Amazon's Choice = highest trust signal
    } else if (badgeLower.includes("best seller") || isBestSeller) {
      score += 50; // Best Seller
    } else if (badgeLower.includes("top rated") || badgeLower.includes("highly rated")) {
      score += 40; // Top Rated / Highly Rated
    } else if (badgeLower.includes("popular")) {
      score += 30; // Popular
    }
  } else if (isBestSeller) {
    score += 50; // Fallback if isBestSeller flag is set without type
  }
  
  // View count contributes to popularity (max 50 points)
  score += Math.min(50, (cached.view_count || 0) * 2);
  
  // TIERED RATINGS BONUS: Give partial credit for incomplete data
  const hasStars = metadata.stars && metadata.stars > 0;
  const hasReviews = metadata.review_count && metadata.review_count > 0;
  
  if (hasStars && hasReviews) {
    score += 50;  // Full bonus for complete data
  } else if (hasReviews) {
    score += 30;  // Partial bonus for reviews without stars (like LAIKOU moisturizer)
  } else if (hasStars) {
    score += 25;  // Partial bonus for stars without reviews
  }
  
  // High ratings boost score (up to 25 points)
  if (hasStars && metadata.stars >= 4) {
    score += (metadata.stars - 3) * 25;
  }
  
  // More reviews = more trusted (up to 25 points)
  if (hasReviews) {
    score += Math.min(25, Math.log10(metadata.review_count + 1) * 10);
  }
  
  return score;
};

/**
 * Sort products by popularity score (cached products with data first)
 */
const sortByPopularity = (products: any[]) => {
  return [...products].sort((a, b) => {
    // Sort by popularity score descending
    return (b.popularity_score || 0) - (a.popularity_score || 0);
  });
};

/**
 * Track search query for Nicole AI trending analysis
 */
const trackSearchTrend = async (supabase: any, query: string) => {
  if (!supabase || !query || query.length < 2) return;

  try {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Upsert to search_trends table
    const { error } = await supabase
      .from('search_trends')
      .upsert(
        { 
          search_query: normalizedQuery,
          search_count: 1,
          last_searched_at: new Date().toISOString()
        },
        { 
          onConflict: 'search_query',
          ignoreDuplicates: false 
        }
      );

    if (error) {
      // If upsert fails, try increment approach
      const { data: existing } = await supabase
        .from('search_trends')
        .select('id, search_count')
        .eq('search_query', normalizedQuery)
        .single();

      if (existing) {
        await supabase
          .from('search_trends')
          .update({ 
            search_count: (existing.search_count || 0) + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('search_trends')
          .insert({ 
            search_query: normalizedQuery,
            search_count: 1,
            last_searched_at: new Date().toISOString()
          });
      }
    }
    
    console.log(`📊 Tracked search trend: "${normalizedQuery}"`);
  } catch (error) {
    // Don't fail the request if trend tracking fails
    console.warn('⚠️ Search trend tracking failed:', error);
  }
};

// Process best seller indicators from Zinc response
const processBestSellerData = (product: any) => {
  let isBestSeller = false;
  let bestSellerType = null;
  let badgeText = null;

  // Check for Amazon's Choice badge
  if (product.is_amazon_choice || 
      product.amazon_choice || 
      product.choice_badge ||
      (product.badges && product.badges.some((badge: any) => 
        badge?.toLowerCase().includes('choice') || 
        badge?.toLowerCase().includes('amazon')))) {
    isBestSeller = true;
    bestSellerType = 'amazon_choice';
    badgeText = "Amazon's Choice";
  }

  // Check for Best Seller rank/badge
  if (product.is_best_seller ||
      product.best_seller ||
      product.bestseller ||
      (product.badges && product.badges.some((badge: any) => 
        badge?.toLowerCase().includes('best') && badge?.toLowerCase().includes('seller'))) ||
      (product.best_seller_rank && product.best_seller_rank <= 100)) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'best_seller';
    badgeText = badgeText || 'Best Seller';
  }

  // Check for high sales volume indicators
  if (product.num_sales && product.num_sales > 1000) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'popular';
    badgeText = badgeText || 'Popular';
  }

  // Check for badge text in various fields
  if (product.badge_text) {
    const badgeTextLower = product.badge_text.toLowerCase();
    if (badgeTextLower.includes('choice') || badgeTextLower.includes('best') || badgeTextLower.includes('seller')) {
      isBestSeller = true;
      bestSellerType = badgeTextLower.includes('choice') ? 'amazon_choice' : 'best_seller';
      badgeText = product.badge_text;
    }
  }

  return {
    isBestSeller,
    bestSellerType,
    badgeText
  };
};

// Luxury category search handler  
const searchLuxuryCategories = async (api_key: string, page: number = 1, priceFilter?: { min?: number; max?: number }) => {
  console.log('Starting luxury category batch search with price filter:', priceFilter);
  
  const luxuryCategories = [
    "top designer bags for women",
    "top designer sunglasses", 
    "luxury watches",
    "designer jewelry"
  ];
  
  return searchCategoryBatch(api_key, luxuryCategories, "luxury items", page, 16, priceFilter);
};

// Best selling category search handler  
const searchBestSellingCategories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  console.log('Starting best selling category batch search with price filter:', priceFilter);
  
  const bestSellingCategories = [
    "best selling electronics gadgets",
    "best selling home kitchen essentials", 
    "best selling fashion clothing",
    "best selling books bestsellers",
    "best selling beauty products",
    "best selling fitness equipment",
    "best selling toys games",
    "popular trending items"
  ];
  
  return searchCategoryBatch(api_key, bestSellingCategories, "best selling products", page, limit, priceFilter);
};

// Electronics category search handler  
const searchElectronicsCategories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  console.log('Starting electronics category batch search with price filter:', priceFilter);
  
  const electronicsCategories = [
    "smartphones phones mobile devices apple samsung",
    "laptops computers macbook dell hp",
    "headphones earbuds airpods bose sony",
    "smart home devices alexa google nest",
    "gaming consoles playstation xbox nintendo",
    "cameras photography canon nikon sony",
    "tablets ipad android surface",
    "smart watches apple watch garmin fitbit"
  ];
  
  return searchCategoryBatch(api_key, electronicsCategories, "electronics gadgets", page, limit, priceFilter);
};

// Gifts for Her category search handler with pagination support
// Shared category batch search utility
const searchCategoryBatch = async (
  api_key: string, 
  categories: string[], 
  batchName: string,
  page: number = 1, 
  limit: number = 20,
  priceFilter?: { max?: number; min?: number }
) => {
  console.log(`Starting ${batchName} category batch search - page ${page}, limit ${limit}`);
  
  const productsPerCategory = Math.ceil(limit / categories.length);
  
  const promises = categories.map(async (category, index) => {
    try {
      const actualPage = page + Math.floor(index / 3); // Stagger pages across categories
      
      // Build URL with proper parameters
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(category)}&page=${actualPage}&retailer=amazon`;
      
      // Try different parameter formats for price filtering
      if (priceFilter?.max) {
        // Try both parameter formats that Zinc might accept
        searchUrl += `&max_price=${priceFilter.max}&price_max=${priceFilter.max}`;
      }
      if (priceFilter?.min) {
        searchUrl += `&min_price=${priceFilter.min}&price_min=${priceFilter.min}`;
      }
      
      console.log(`Searching ${batchName} category: ${category} (page ${actualPage})`);
      console.log(`Search URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      
      const data = await response.json();
      console.log(`API Response for ${category}:`, JSON.stringify(data, null, 2));
      
      if (data.results && Array.isArray(data.results)) {
        const startIndex = page === 1 ? 0 : (page - 1) * 2;
        const endIndex = startIndex + productsPerCategory;
        let categoryResults = data.results.slice(startIndex, endIndex);
        
        // Additional price filtering for budget categories - try multiple price field formats
        if (priceFilter?.max) {
          categoryResults = categoryResults.filter((product: any) => {
            // Zinc API returns prices in cents - extract price value
            let price = 0;
            if (product.price) {
              if (typeof product.price === 'string') {
                // Handle string prices like "$19.99" or "1999"
                const cleanPrice = product.price.replace(/[$,]/g, '');
                const numPrice = parseFloat(cleanPrice);
                // If the number is greater than 100, assume it's in cents
                price = numPrice > 100 ? numPrice / 100 : numPrice;
              } else if (typeof product.price === 'number') {
                // If the number is greater than 100, assume it's in cents
                price = product.price > 100 ? product.price / 100 : product.price;
              }
            } else if (product.price_amount) {
              price = product.price_amount > 100 ? product.price_amount / 100 : product.price_amount;
            } else if (product.price_cents) {
              price = product.price_cents / 100;
            }
            
            const isUnderBudget = price > 0 && price <= priceFilter.max!;
            const meetsMinimum = !priceFilter.min || price >= priceFilter.min;
            const passesFilter = isUnderBudget && meetsMinimum;
            
            console.log(`Product: ${product.title}, Original Price: ${product.price}, Converted Price: ${price}, Max: ${priceFilter.max}, Min: ${priceFilter.min || 'none'}, Passes Filter: ${passesFilter}`);
            return passesFilter;
          });
        }
        
        const processedResults = categoryResults.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          
          // Normalize price from cents to dollars
          let normalizedPrice = product.price;
          if (typeof product.price === 'number' && product.price > 100) {
            normalizedPrice = product.price / 100;
            console.log(`🔄 Category price conversion: "${product.title}" - Original: ${product.price} cents → Converted: $${normalizedPrice}`);
          } else if (typeof product.price === 'string') {
            const numericPrice = parseFloat(product.price.replace(/[$,]/g, ''));
            if (numericPrice > 100) {
              normalizedPrice = numericPrice / 100;
              console.log(`🔄 Category price conversion (string): "${product.title}" - Original: ${product.price} → Converted: $${normalizedPrice}`);
            } else {
              normalizedPrice = numericPrice;
            }
          }
          
          return {
            ...product,
            ...bestSellerData,
            categorySource: category,
            price: normalizedPrice,
            // Preserve all image-related fields
            image: product.image,
            main_image: product.main_image, 
            images: product.images,
            additional_images: product.additional_images,
            thumbnail: product.thumbnail,
            image_url: product.image_url
          };
        });
        
        console.log(`Found ${processedResults.length} products for category: ${category}`);
        return processedResults;
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching category ${category}:`, error);
      return [];
    }
  });
  
  try {
    const categoryResults = await Promise.all(promises);
    const allResults = categoryResults.flat();
    
    // Shuffle to prevent category clustering
    for (let i = allResults.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allResults[i], allResults[j]] = [allResults[j], allResults[i]];
    }
    
    const paginatedResults = allResults.slice(0, limit);
    
    console.log(`${batchName} category search complete: ${paginatedResults.length} products returned (page ${page})`);
    
    return {
      products: paginatedResults, // Changed from 'results' to 'products' for consistency
      results: paginatedResults,  // Keep 'results' for backward compatibility  
      total: paginatedResults.length,
      hasMore: allResults.length > limit || page <= 5,
      currentPage: page,
      categoryBatch: true
    };
    
  } catch (error) {
    console.error(`Error in ${batchName} category batch search:`, error);
    throw error;
  }
};

// Gifts for Her category search handler
const searchGiftsForHerCategories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  const giftsForHerCategories = [
    "skincare essentials for women",
    "cozy sweaters and cardigans", 
    "candles and home fragrance",
    "books and reading accessories",
    "yoga and fitness accessories",
    "coffee and tea gifts"
  ];
  
  return searchCategoryBatch(api_key, giftsForHerCategories, "gifts for her", page, limit, priceFilter);
};

// Gifts for Him category search handler
const searchGiftsForHimCategories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  const giftsForHimCategories = [
    "tech gadgets for men",
    "grooming essentials",
    "fitness and sports gear",
    "watches and accessories", 
    "tools and gadgets",
    "gaming accessories"
  ];
  
  return searchCategoryBatch(api_key, giftsForHimCategories, "gifts for him", page, limit, priceFilter);
};

// Gifts Under $50 category search handler
const searchGiftsUnder50Categories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  const giftsUnder50Categories = [
    "best gifts under 50", // More generic, higher chance of results
    "popular products under 50", // Another generic category
    "bluetooth earbuds under 50",
    "phone accessories under 50", 
    "kitchen gadgets under 50", // Changed from "utensils" to "gadgets"
    "skincare sets under 50", // Changed from "products" to "sets"
    "jewelry gifts under 50", // Made more specific
    "home decor items under 50", // Made more specific
    "tech accessories under 50", // Added new category
    "books under 50", // Added simple category
    "coffee accessories under 50", // Added specific category
    "fitness accessories under 50" // Added another category
  ];
  
  // Combine provided price filter with default $50 max
  const combinedFilter = {
    max: Math.min(priceFilter?.max || 50, 50), // Never exceed $50 for this category
    min: priceFilter?.min || 1 // Set minimum to $1 to avoid very cheap items
  };
  
  console.log(`Starting gifts under $50 search with filter:`, combinedFilter);
  
  return searchCategoryBatch(api_key, giftsUnder50Categories, "gifts under $50", page, limit, combinedFilter);
};

// Brand category mappings for multi-category brand searches
const BRAND_CATEGORY_MAPPINGS = {
  apple: [
    "apple macbook laptop computers",
    "apple iphone smartphones",
    "apple ipad tablets", 
    "apple watch smartwatch",
    "apple airpods earbuds headphones",
    "apple mac desktop computers"
  ],
  nike: [
    "nike running shoes",
    "nike athletic clothing apparel",
    "nike basketball shoes",
    "nike workout gear",
    "nike sports accessories"
  ],
  samsung: [
    "samsung galaxy phones",
    "samsung tablets",
    "samsung smartwatch",
    "samsung earbuds",
    "samsung laptops",
    "samsung televisions TVs"
  ],
  sony: [
    "sony headphones",
    "sony cameras", 
    "sony playstation gaming",
    "sony speakers",
    "sony televisions TVs",
    "sony electronics"
  ],
  adidas: [
    "adidas running shoes",
    "adidas athletic clothing",
    "adidas soccer cleats",
    "adidas workout gear",
    "adidas sports accessories"
  ],
  athleisure: [
    "yoga pants leggings",
    "athletic workout tops",
    "sports bras women",
    "activewear shorts",
    "yoga accessories",
    "athletic clothing",
    "workout gear",
    "athleisure wear"
  ],
  madein: [
    "made in cookware pots pans",
    "made in kitchen knives",
    "made in bakeware",
    "made in kitchen accessories",
    "made in carbon steel pans"
  ],
  lego: [
    "lego building sets",
    "lego architecture",
    "lego creator sets",
    "lego technic",
    "lego minifigures"
  ]
};

// Brand categories search handler with brand filtering
const searchBrandCategories = async (api_key: string, brandName: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  console.log(`Starting brand category search for: ${brandName}`);
  
  const brandKey = brandName.toLowerCase().replace(/\s+/g, '');
  const categories = BRAND_CATEGORY_MAPPINGS[brandKey as keyof typeof BRAND_CATEGORY_MAPPINGS];
  
  if (!categories) {
    console.log(`No category mapping found for brand: ${brandName}, using fallback search`);
    // Fallback to single brand search
    try {
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(brandName)}&page=${page}&retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      const data = await response.json();
      
      // Filter results by brand
      let filteredResults = data.results || [];
      if (filteredResults.length > 0) {
        filteredResults = filteredResults.filter((product: any) => {
          const productBrand = (product.brand || '').toLowerCase();
          const targetBrand = brandName.toLowerCase();
          return productBrand.includes(targetBrand) || targetBrand.includes(productBrand);
        });
        console.log(`Filtered fallback search: ${filteredResults.length} products match brand ${brandName}`);
      }
      
      return {
        products: filteredResults, // Changed from 'results' to 'products' for consistency
        results: filteredResults,  // Keep 'results' for backward compatibility
        total: filteredResults.length
      };
    } catch (error) {
      console.error(`Fallback search failed for ${brandName}:`, error);
      return { results: [], total: 0 };
    }
  }
  
  // Use category batch search and then filter by brand
  const categoryResults = await searchCategoryBatch(api_key, categories, `${brandName} products`, page, limit, priceFilter);
  
  // Filter results to only include products from the specified brand
  if (categoryResults.results && categoryResults.results.length > 0) {
    const filteredResults = categoryResults.results.filter((product: any) => {
      const productBrand = (product.brand || '').toLowerCase().trim();
      const targetBrand = brandName.toLowerCase().trim();
      
      // More flexible brand matching
      const isMatch = productBrand === targetBrand || 
                     productBrand.includes(targetBrand) || 
                     targetBrand.includes(productBrand);
      
      console.log(`Checking product: "${product.title}" | Product brand: "${product.brand}" | Target: "${brandName}" | Match: ${isMatch}`);
      
      return isMatch;
    });
    
    console.log(`Brand filtering complete: ${filteredResults.length} of ${categoryResults.results.length} products match brand "${brandName}"`);
    
    // If no results after filtering, try a fallback search with brand name included
    if (filteredResults.length === 0) {
      console.log(`No products found after filtering, trying fallback search with brand name included`);
      
      try {
        const fallbackCategories = categories.map(cat => `${brandName.toLowerCase()} ${cat}`);
        const fallbackResults = await searchCategoryBatch(api_key, fallbackCategories, `${brandName} fallback`, page, limit, priceFilter);
        
        if (fallbackResults.results && fallbackResults.results.length > 0) {
          const fallbackFiltered = fallbackResults.results.filter((product: any) => {
            const productBrand = (product.brand || '').toLowerCase().trim();
            const targetBrand = brandName.toLowerCase().trim();
            return productBrand === targetBrand || productBrand.includes(targetBrand);
          });
          
          console.log(`Fallback search returned ${fallbackFiltered.length} products for ${brandName}`);
          
          return {
            ...categoryResults,
            results: fallbackFiltered,
            total: fallbackFiltered.length
          };
        }
      } catch (error) {
        console.error(`Fallback search failed:`, error);
      }
    }
    
    return {
      ...categoryResults,
      results: filteredResults,
      total: filteredResults.length
    };
  }
  
  return categoryResults;
};

serve(async (req) => {
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (method === 'POST') {
    // Get API key from environment (unified approach)
    const api_key = getZincApiKey();
    
    if (!api_key) {
      console.error('⚠️  No Zinc API key configured');
      return new Response(
        JSON.stringify({ 
          error: 'Product search is not configured. Please add ZINC_API_KEY to Supabase secrets.',
          products: [],
          results: [],
          total: 0,
          needsConfiguration: true
        }),
        { 
          status: 503, // Service Unavailable (not 500 Internal Server Error)
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    console.log('✅ Using Zinc API key from environment');
    
    // Initialize Supabase client for cache operations
    const supabase = getSupabaseClient();
    
    const {query, retailer = "amazon", page = 1, limit = 20, luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, bestSelling = false, electronics = false, brandCategories = false, filters = {}} = await req.json();
    
    // Check if this is a "default" load with no specific query or category flags
    const hasNoSearchIntent = !query && 
                              !luxuryCategories && 
                              !giftsForHer && 
                              !giftsForHim && 
                              !giftsUnder50 && 
                              !electronics && 
                              !brandCategories;
    
    // If no search intent, default to best selling products
    const effectiveBestSelling = bestSelling || hasNoSearchIntent;
    
    if (hasNoSearchIntent) {
      console.log('📦 No search intent detected, defaulting to best selling products');
    }
    
    // Extract price filters from filters object
    const priceFilter = {
      min: filters.min_price || filters.minPrice,
      max: filters.max_price || filters.maxPrice
    };
    
    // Extract sortBy from filters (server-side sorting)
    const sortBy = filters.sortBy || 'popularity';
    
    console.log('Price filter extracted:', priceFilter, 'SortBy:', sortBy);
    
    // Track search trend for Nicole AI (async, non-blocking)
    if (query) {
      trackSearchTrend(supabase, query);
    }
    
    try {
      // Handle luxury category batch search
      if (luxuryCategories) {
        console.log('Processing luxury category batch request with price filter:', priceFilter);
        const luxuryData = await searchLuxuryCategories(api_key, page, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = luxuryData.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, 'luxury'));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...luxuryData,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts for her category batch search
      if (giftsForHer) {
        console.log('Processing gifts for her category batch request with price filter:', priceFilter);
        const giftsForHerData = await searchGiftsForHerCategories(api_key, page, limit, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = giftsForHerData.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, 'gifts_for_her'));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...giftsForHerData,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle electronics category batch search
      if (electronics) {
        console.log('Processing electronics category batch request with price filter:', priceFilter);
        const electronicsData = await searchElectronicsCategories(api_key, page, limit, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = electronicsData.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, 'electronics'));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...electronicsData,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle best selling category batch search (or default when no search intent)
      if (effectiveBestSelling) {
        console.log('Processing best selling category batch request with price filter:', priceFilter);
        const bestSellingData = await searchBestSellingCategories(api_key, page, limit, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = bestSellingData.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, 'best_selling'));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...bestSellingData,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts for him category batch search
      if (giftsForHim) {
        console.log('Processing gifts for him category batch request with price filter:', priceFilter);
        const giftsForHimData = await searchGiftsForHimCategories(api_key, page, limit, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = giftsForHimData.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, 'gifts_for_him'));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...giftsForHimData,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts under $50 category batch search
      if (giftsUnder50) {
        console.log('Processing gifts under $50 category batch request with price filter:', priceFilter);
        const giftsUnder50Data = await searchGiftsUnder50Categories(api_key, page, limit, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = giftsUnder50Data.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, 'gifts_under_50'));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...giftsUnder50Data,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle brand categories search
      if (brandCategories && query) {
        console.log(`Processing brand categories request for: ${query} with price filter:`, priceFilter);
        const brandData = await searchBrandCategories(api_key, query, page, limit, priceFilter);
        
        // Process best seller data BEFORE caching
        const processedResults = brandData.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return { ...product, ...bestSellerData };
        });
        
        // Cache results in background for future queries (Nicole organic growth)
        EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, query));
        
        // Enrich with cached data
        const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, processedResults);
        const sortedProducts = sortByPopularity(enrichedProducts);
        
        return new Response(JSON.stringify({
          ...brandData,
          products: sortedProducts,
          results: sortedProducts,
          cacheStats: { hits: cacheHits, misses: cacheMisses }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // CACHE-FIRST LOOKUP: Check if we have enough cached products for this query
      // This is the key to Nicole's organic growth strategy - subsequent identical queries cost $0
      const cachedResults = await getCachedProductsForQuery(supabase, query, limit);
      
      if (cachedResults && cachedResults.length > 0) {
        console.log(`🎯 Returning ${cachedResults.length} cached products for "${query}" - Zinc API call SKIPPED ($0.00)`);
        
        // Apply sorting to cached results
        let sortedProducts = [...cachedResults];
        if (sortBy === 'price-low') {
          sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-high') {
          sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === 'rating') {
          sortedProducts.sort((a, b) => (b.stars || b.rating || 0) - (a.stars || a.rating || 0));
        } else {
          sortedProducts = sortByPopularity(cachedResults);
        }
        
        return new Response(JSON.stringify({
          products: sortedProducts,
          results: sortedProducts,
          total: sortedProducts.length,
          originalTotal: sortedProducts.length,
          fromCache: true,
          cacheStats: { hits: sortedProducts.length, misses: 0 }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Cache miss - proceed with Zinc API call
      console.log(`⏳ Cache miss for "${query}" - calling Zinc API ($0.01)`);
      
      // Enhanced single search logic with price filtering support
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=${retailer}`;
      
      // Add price filters to the URL if provided
      if (filters?.min_price) {
        searchUrl += `&min_price=${filters.min_price}`;
      }
      if (filters?.max_price) {
        searchUrl += `&max_price=${filters.max_price}`;
      }
      
      console.log('🎯 Zinc API URL with price filters:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
  
      const data = await response.json();
      
      // Apply post-search price filtering if Zinc API didn't handle it properly
      let filteredResults = data.results || [];
      if ((filters?.min_price || filters?.max_price) && filteredResults.length > 0) {
        const minPrice = filters.min_price;
        const maxPrice = filters.max_price;
        
        filteredResults = filteredResults.filter(product => {
          const price = product.price;
          if (!price) return true; // Keep products without price info
          
          const priceInDollars = typeof price === 'number' ? price : parseFloat(price) || 0;
          
          let passesFilter = true;
          if (minPrice && priceInDollars < minPrice) passesFilter = false;
          if (maxPrice && priceInDollars > maxPrice) passesFilter = false;
          
          return passesFilter;
        });
        
        console.log(`🎯 Post-search price filtering: ${data.results.length} → ${filteredResults.length} products (${minPrice ? `$${minPrice}` : 'no min'} to ${maxPrice ? `$${maxPrice}` : 'no max'})`);
      }
      
      // Universal relevance filter - removes products that don't match any search terms
      // This prevents Zinc's OR-logic from returning irrelevant products (e.g., "dal" soup for "dallas cowboys")
      if (query && filteredResults.length > 0) {
        const searchTerms = query.toLowerCase()
          .split(/\s+/)
          .filter(term => term.length >= 3); // Only meaningful terms (3+ chars)
        
        if (searchTerms.length > 0) {
          const beforeCount = filteredResults.length;
          filteredResults = filteredResults.filter((product: any) => {
            const title = (product.title || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();
            
            // Keep product if ANY search term appears in title, category, or brand
            return searchTerms.some(term => 
              title.includes(term) || category.includes(term) || brand.includes(term)
            );
          });
          
          console.log(`🎯 Relevance filter: ${beforeCount} → ${filteredResults.length} products (query: "${query}")`);
        }
      }
      
      // UNSUPPORTED PRODUCT FILTER: Remove products Zinc can't fulfill
      // Blocks: digital products, gift cards, Prime Pantry, Amazon Fresh
      if (filteredResults && filteredResults.length > 0) {
        const beforeUnsupportedFilter = filteredResults.length;
        let blockedCount = 0;
        
        filteredResults = filteredResults.filter((product: any) => {
          // Check Zinc boolean flags
          if (product.digital === true) {
            blockedCount++;
            console.log(`🚫 Blocked digital product: "${product.title}"`);
            return false;
          }
          if (product.fresh === true) {
            blockedCount++;
            console.log(`🚫 Blocked Amazon Fresh product: "${product.title}"`);
            return false;
          }
          if (product.pantry === true) {
            blockedCount++;
            console.log(`🚫 Blocked Prime Pantry product: "${product.title}"`);
            return false;
          }
          
          const title = (product.title || '').toLowerCase();
          const category = (product.category || product.categories?.[0] || '').toLowerCase();
          
          // Block gift cards
          if (/gift\s*card|e-?gift|egift/i.test(title)) {
            blockedCount++;
            console.log(`🚫 Blocked gift card: "${product.title}"`);
            return false;
          }
          
          // Block digital downloads/codes
          if (/kindle\s*edition|\[ebook\]|digital\s*(download|code)|online\s*game\s*code|pc\s*download/i.test(title)) {
            blockedCount++;
            console.log(`🚫 Blocked digital product: "${product.title}"`);
            return false;
          }
          
          // Block by category patterns
          if (/kindle\s*store|digital\s*music|digital\s*video/i.test(category)) {
            blockedCount++;
            console.log(`🚫 Blocked digital category: "${product.title}" (${category})`);
            return false;
          }
          
          return true;
        });
        
        if (blockedCount > 0) {
          console.log(`🎯 Unsupported product filter: ${beforeUnsupportedFilter} → ${filteredResults.length} products (blocked ${blockedCount})`);
        }
      }

      // Process best seller data for each product
      if (filteredResults && Array.isArray(filteredResults)) {
        filteredResults = filteredResults.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return {
            ...product,
            ...bestSellerData
          };
        });
      }
  
      // Process and normalize prices (Zinc API returns prices in cents)
      if (filteredResults && Array.isArray(filteredResults)) {
        filteredResults = filteredResults.map((product: any) => {
          const pickFirst = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && isNaN(v)));
          let priceCandidate: any = pickFirst(
            product.price,
            product.price_cents,
            product.offer_price_cents,
            product.sale_price_cents,
            product.list_price_cents,
            product.current_price,
            product.list_price,
            product.price_string,
            product.deal_price_cents
          );

          let normalizedPrice = 0;
          if (typeof priceCandidate === 'number') {
            normalizedPrice = priceCandidate > 100 ? priceCandidate / 100 : priceCandidate;
          } else if (typeof priceCandidate === 'string') {
            const num = parseFloat(priceCandidate.replace(/[$,]/g, ''));
            normalizedPrice = isNaN(num) ? 0 : (num > 100 ? num / 100 : num);
          }

          return {
            ...product,
            price: normalizedPrice,
            // Preserve all image-related fields
            image: product.image,
            main_image: product.main_image,
            images: product.images,
            additional_images: product.additional_images,
            thumbnail: product.thumbnail,
            image_url: product.image_url
          };
        });
      }

      // Log price debugging info for first few products after conversion
      if (filteredResults && filteredResults.length > 0) {
        console.log('🔍 Price debugging after conversion - First 3 products:');
        filteredResults.slice(0, 3).forEach((product: any, index: number) => {
          console.log(`Product ${index + 1}: "${product.title}" - Final Price: $${product.price} (type: ${typeof product.price})`);
        });
      }

      // Cache search results in background for future queries (Nicole organic growth)
      // This ensures the same query from any user will hit cache next time
      EdgeRuntime.waitUntil(cacheSearchResults(supabase, filteredResults, query));

      // Enrich with cached data (ratings, reviews, images)
      const { products: enrichedProducts, cacheHits, cacheMisses } = await enrichWithCachedData(supabase, filteredResults);
      
      // Server-side sorting based on sortBy parameter
      let sortedProducts = [...enrichedProducts];
      if (sortBy === 'price-low') {
        sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === 'price-high') {
        sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sortBy === 'rating') {
        sortedProducts.sort((a, b) => (b.stars || b.rating || 0) - (a.stars || a.rating || 0));
      } else {
        // Default: popularity (cached products with good data first)
        sortedProducts = sortByPopularity(enrichedProducts);
      }

      return new Response(JSON.stringify({
        products: sortedProducts, // Changed from 'results' to 'products' for consistency
        results: sortedProducts,  // Keep 'results' for backward compatibility
        total: sortedProducts.length,
        originalTotal: data.total || 0,
        priceFiltered: (filters?.min_price || filters?.max_price) ? true : false,
        cacheStats: { hits: cacheHits, misses: cacheMisses }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch(error) {
      console.error('Error in get-products function:', error);
      return new Response(
        JSON.stringify({
          success: false, 
          error: 'Product search failed',
          message: error.message || 'Internal server error',
          products: [], // Ensure empty products array for consistent response format
          results: []   // Keep results for backward compatibility
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
  }
})
