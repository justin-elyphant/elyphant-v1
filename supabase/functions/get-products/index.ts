// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// PHASE 1: CATEGORY REGISTRY - Single source of truth for all category configs
// Replaces 6 separate category handler functions (~200 lines removed)
// ============================================================================
const CATEGORY_REGISTRY: Record<string, {
  name: string;
  queries: string[];
  priceMax?: number;
  priceMin?: number;
}> = {
  'luxury': {
    name: 'Luxury Items',
    queries: [
      "top designer bags for women",
      "top designer sunglasses", 
      "luxury watches",
      "designer jewelry"
    ]
  },
  'gifts-for-her': {
    name: 'Gifts for Her',
    queries: [
      "skincare essentials for women",
      "cozy sweaters and cardigans", 
      "candles and home fragrance",
      "books and reading accessories",
      "yoga and fitness accessories",
      "coffee and tea gifts"
    ]
  },
  'gifts-for-him': {
    name: 'Gifts for Him',
    queries: [
      "tech gadgets for men",
      "grooming essentials",
      "fitness and sports gear",
      "watches and accessories", 
      "tools and gadgets",
      "gaming accessories"
    ]
  },
  'gifts-under-50': {
    name: 'Gifts Under $50',
    queries: [
      "best gifts under 50",
      "popular products under 50",
      "bluetooth earbuds under 50",
      "phone accessories under 50", 
      "kitchen gadgets under 50",
      "skincare sets under 50",
      "jewelry gifts under 50",
      "home decor items under 50",
      "tech accessories under 50",
      "books under 50",
      "coffee accessories under 50",
      "fitness accessories under 50"
    ],
    priceMax: 50,
    priceMin: 1
  },
  'electronics': {
    name: 'Electronics & Gadgets',
    queries: [
      "smartphones phones mobile devices apple samsung",
      "laptops computers macbook dell hp",
      "headphones earbuds airpods bose sony",
      "smart home devices alexa google nest",
      "gaming consoles playstation xbox nintendo",
      "cameras photography canon nikon sony",
      "tablets ipad android surface",
      "smart watches apple watch garmin fitbit"
    ]
  },
  'best-selling': {
    name: 'Best Sellers',
    queries: [
      "best selling electronics gadgets",
      "best selling home kitchen essentials", 
      "best selling fashion clothing",
      "best selling books bestsellers",
      "best selling beauty products",
      "best selling fitness equipment",
      "best selling toys games",
      "popular trending items"
    ]
  }
};

// Legacy flag to category mapping (backward compatibility during migration)
const LEGACY_FLAG_TO_CATEGORY: Record<string, string> = {
  'luxuryCategories': 'luxury',
  'giftsForHer': 'gifts-for-her',
  'giftsForHim': 'gifts-for-him',
  'giftsUnder50': 'gifts-under-50',
  'electronics': 'electronics',
  'bestSelling': 'best-selling'
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
          // Enrich with real Zinc sales data
          num_sales: metadata.num_sales || product.num_sales || null,
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
        num_sales: p.num_sales || null,
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
 * Includes fuzzy matching with pg_trgm for typo tolerance (Phase 2)
 * Returns cached products if sufficient, null otherwise
 */
const getCachedProductsForQuery = async (supabase: any, query: string, limit: number) => {
  if (!supabase || !query || query.length < 2) return null;

  try {
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length >= 3);
    
    if (searchTerms.length === 0) return null;

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
      return {
        products: cachedProducts.map((p: any) => transformCachedProduct(p)),
        fuzzyMatched: false,
        suggestedCorrection: null
      };
    }

    // PHASE 2: Try fuzzy matching if exact match fails
    if (cachedProducts && cachedProducts.length < threshold) {
      console.log(`🔍 Trying fuzzy search for "${query}"...`);
      
      const { data: fuzzyResults, error: fuzzyError } = await supabase
        .rpc('fuzzy_product_search', { 
          search_query: normalizedQuery, 
          similarity_threshold: 0.3,
          result_limit: limit 
        });

      if (!fuzzyError && fuzzyResults && fuzzyResults.length >= threshold) {
        console.log(`✅ Fuzzy MATCH: Found ${fuzzyResults.length} products for "${query}"`);
        
        // Get the most similar title for "Did you mean?" suggestion
        const suggestedCorrection = fuzzyResults[0]?.title 
          ? extractCorrectionFromTitle(fuzzyResults[0].title, query)
          : null;
        
        return {
          products: fuzzyResults.map((p: any) => transformCachedProduct(p)),
          fuzzyMatched: true,
          suggestedCorrection
        };
      }
    }

    console.log(`⏳ Cache MISS: Only ${cachedProducts?.length || 0} products for "${query}" (need ${threshold})`);
    return null;
  } catch (error) {
    console.warn('⚠️ Cache lookup error:', error);
    return null;
  }
};

/**
 * Transform cached product to standard format
 */
const transformCachedProduct = (p: any) => ({
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
  num_sales: p.metadata?.num_sales || null,
  isBestSeller: p.metadata?.isBestSeller || false,
  bestSellerType: p.metadata?.bestSellerType,
  badgeText: p.metadata?.badgeText,
  is_cached: true,
  view_count: p.view_count || 0,
  popularity_score: calculatePopularityScore(p, p.metadata || {}),
  from_cache: true
});

/**
 * Extract a clean correction suggestion from a product title
 */
const extractCorrectionFromTitle = (title: string, originalQuery: string) => {
  const words = title.toLowerCase().split(/\s+/).slice(0, 3);
  const queryWords = originalQuery.toLowerCase().split(/\s+/);
  
  // Find the word that's most similar to what user typed
  for (const queryWord of queryWords) {
    for (const titleWord of words) {
      if (titleWord.length > 3 && 
          titleWord !== queryWord && 
          (titleWord.includes(queryWord.substring(0, 3)) || queryWord.includes(titleWord.substring(0, 3)))) {
        return words.join(' ');
      }
    }
  }
  return null;
};

/**
 * PHASE 3: Get fallback products for zero results
 */
const getZeroResultFallbacks = async (supabase: any, query: string, limit: number = 8) => {
  if (!supabase) return { suggestedQueries: [], fallbackProducts: [] };

  try {
    // Get similar trending queries
    const { data: similarQueries } = await supabase
      .from('search_trends')
      .select('search_query, search_count')
      .order('search_count', { ascending: false })
      .limit(5);

    // Get best-selling products as fallback
    const { data: fallbackProducts } = await supabase
      .from('products')
      .select('product_id, title, price, image_url, brand, metadata, view_count')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    // Log zero-result query for Nicole AI analysis
    if (query) {
      await supabase.from('search_trends').upsert({
        search_query: query.toLowerCase().trim(),
        search_count: 1,
        last_searched_at: new Date().toISOString(),
        zero_results: true
      }, { onConflict: 'search_query' });
    }

    return {
      suggestedQueries: (similarQueries || []).map((q: any) => q.search_query),
      fallbackProducts: (fallbackProducts || []).map((p: any) => transformCachedProduct(p))
    };
  } catch (error) {
    console.warn('⚠️ Zero-result fallback error:', error);
    return { suggestedQueries: [], fallbackProducts: [] };
  }
};

/**
 * PHASE 4: Generate facets from search results
 */
const generateFacetsFromResults = (products: any[]) => {
  if (!products || products.length === 0) {
    return null;
  }

  // Brand facets
  const brandCounts: Record<string, number> = {};
  products.forEach(p => {
    const brand = p.brand?.trim();
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }
  });

  const brands = Object.entries(brandCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Price range facets
  const priceRanges = [
    { label: 'Under $25', min: 0, max: 25, count: 0 },
    { label: '$25 - $50', min: 25, max: 50, count: 0 },
    { label: '$50 - $100', min: 50, max: 100, count: 0 },
    { label: '$100 - $200', min: 100, max: 200, count: 0 },
    { label: 'Over $200', min: 200, max: Infinity, count: 0 }
  ];

  products.forEach(p => {
    const price = p.price || 0;
    for (const range of priceRanges) {
      if (price >= range.min && price < range.max) {
        range.count++;
        break;
      }
    }
  });

  // Category facets
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    const category = p.category?.trim() || p.categories?.[0]?.trim();
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    brands,
    priceRanges: priceRanges.filter(r => r.count > 0),
    categories
  };
};

/**
 * PHASE 5: Apply personalized ranking boost
 */
const applyPersonalizedRanking = async (
  supabase: any, 
  products: any[], 
  userId?: string
) => {
  if (!supabase || !userId || !products || products.length === 0) {
    return products;
  }

  try {
    // Fetch user profile with size preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .single();

    if (!profile?.metadata?.sizes) {
      return products;
    }

    const userSizes = profile.metadata.sizes;
    console.log(`🎯 Applying personalization for user ${userId}:`, userSizes);

    // Apply ranking boost for products matching user preferences
    return products.map(product => {
      let personalizedBoost = 0;
      const title = (product.title || '').toLowerCase();

      // Size matching for clothing
      if (userSizes.tops && title.includes('shirt') || title.includes('top') || title.includes('jacket')) {
        if (title.includes(userSizes.tops.toLowerCase())) {
          personalizedBoost += 20;
        }
      }

      if (userSizes.shoes && (title.includes('shoe') || title.includes('sneaker'))) {
        if (title.includes(userSizes.shoes)) {
          personalizedBoost += 20;
        }
      }

      return {
        ...product,
        popularity_score: (product.popularity_score || 0) + personalizedBoost,
        personalized: personalizedBoost > 0
      };
    }).sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
  } catch (error) {
    console.warn('⚠️ Personalization error:', error);
    return products;
  }
};

/**
 * Calculate popularity score for smart sorting
 */
const calculatePopularityScore = (cached: any, metadata: any) => {
  let score = 0;
  
  // Baseline bonus for cached products
  if (cached.view_count !== undefined || cached.product_id) {
    score += 20;
  }
  
  // Best Seller badge bonuses
  const bestSellerType = metadata.bestSellerType || metadata.best_seller_type || 
                         metadata.badgeText || metadata.badge_text || '';
  const isBestSeller = metadata.isBestSeller || metadata.is_best_seller || false;
  
  const numSales = metadata.num_sales || cached.num_sales || 0;
  if (numSales > 1000) {
    score += 50;
  } else if (numSales > 500) {
    score += 30;
  }
  
  if (bestSellerType) {
    const badgeLower = bestSellerType.toLowerCase();
    if (badgeLower.includes("amazon's choice") || badgeLower.includes("amazons choice")) {
      score += 60;
    } else if (badgeLower.includes("best seller") || isBestSeller) {
      score += 50;
    } else if (badgeLower.includes("top rated") || badgeLower.includes("highly rated")) {
      score += 40;
    } else if (badgeLower.includes("popular")) {
      score += 30;
    }
  } else if (isBestSeller) {
    score += 50;
  }
  
  // View count contributes to popularity (max 50 points)
  score += Math.min(50, (cached.view_count || 0) * 2);
  
  // Tiered ratings bonus
  const hasStars = metadata.stars && metadata.stars > 0;
  const hasReviews = metadata.review_count && metadata.review_count > 0;
  
  if (hasStars && hasReviews) {
    score += 50;
  } else if (hasReviews) {
    score += 30;
  } else if (hasStars) {
    score += 25;
  }
  
  if (hasStars && metadata.stars >= 4) {
    score += (metadata.stars - 3) * 25;
  }
  
  if (hasReviews) {
    score += Math.min(25, Math.log10(metadata.review_count + 1) * 10);
  }
  
  return score;
};

/**
 * Sort products by popularity score
 */
const sortByPopularity = (products: any[]) => {
  return [...products].sort((a, b) => {
    return (b.popularity_score || 0) - (a.popularity_score || 0);
  });
};

/**
 * Track search query for Nicole AI trending analysis
 * Uses select-then-increment pattern to properly count repeat searches
 */
const trackSearchTrend = async (supabase: any, query: string) => {
  if (!supabase || !query || query.length < 2) return;

  try {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check if query already exists
    const { data: existing } = await supabase
      .from('search_trends')
      .select('id, search_count')
      .eq('search_query', normalizedQuery)
      .single();

    if (existing) {
      // Increment existing count
      await supabase
        .from('search_trends')
        .update({ 
          search_count: (existing.search_count || 0) + 1,
          last_searched_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      console.log(`📊 Search trend incremented: "${normalizedQuery}" → ${existing.search_count + 1}`);
    } else {
      // Insert new trend
      await supabase
        .from('search_trends')
        .insert({ 
          search_query: normalizedQuery,
          search_count: 1,
          last_searched_at: new Date().toISOString()
        });
      
      console.log(`📊 New search trend tracked: "${normalizedQuery}"`);
    }
  } catch (error) {
    console.warn('⚠️ Search trend tracking failed:', error);
  }
};

// Process best seller indicators from Zinc response
const processBestSellerData = (product: any) => {
  let isBestSeller = false;
  let bestSellerType = null;
  let badgeText = null;

  if (product.is_amazon_choice || product.amazon_choice || product.choice_badge ||
      (product.badges && product.badges.some((badge: any) => 
        badge?.toLowerCase().includes('choice') || badge?.toLowerCase().includes('amazon')))) {
    isBestSeller = true;
    bestSellerType = 'amazon_choice';
    badgeText = "Amazon's Choice";
  }

  if (product.is_best_seller || product.best_seller || product.bestseller ||
      (product.badges && product.badges.some((badge: any) => 
        badge?.toLowerCase().includes('best') && badge?.toLowerCase().includes('seller'))) ||
      (product.best_seller_rank && product.best_seller_rank <= 100)) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'best_seller';
    badgeText = badgeText || 'Best Seller';
  }

  if (product.num_sales && product.num_sales > 1000) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'popular';
    badgeText = badgeText || 'Popular';
  }

  if (product.badge_text) {
    const badgeTextLower = product.badge_text.toLowerCase();
    if (badgeTextLower.includes('choice') || badgeTextLower.includes('best') || badgeTextLower.includes('seller')) {
      isBestSeller = true;
      bestSellerType = badgeTextLower.includes('choice') ? 'amazon_choice' : 'best_seller';
      badgeText = product.badge_text;
    }
  }

  return { isBestSeller, bestSellerType, badgeText };
};

// ============================================================================
// PHASE 2: UNIFIED RESPONSE HANDLER
// Replaces 6 duplicate processing blocks (~150 lines removed)
// ============================================================================

/**
 * Unified processor for all category and search results
 * Handles: best seller processing, caching, enrichment, sorting, and response formatting
 */
const processAndReturnResults = async (
  supabase: any,
  rawResults: any[],
  sourceQuery: string,
  sortBy: string = 'popularity',
  additionalData: Record<string, any> = {}
) => {
  // 1. Process best seller data for each product
  const processedResults = rawResults.map((product: any) => {
    const bestSellerData = processBestSellerData(product);
    return { ...product, ...bestSellerData };
  });
  
  // 2. Cache results in background for future queries (Nicole organic growth)
  EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, sourceQuery));
  
  // 3. Enrich with cached data (ratings, reviews, images)
  const { products: enrichedProducts, cacheHits, cacheMisses } = 
    await enrichWithCachedData(supabase, processedResults);
  
  // 4. Apply sorting based on sortBy parameter
  let sortedProducts = [...enrichedProducts];
  if (sortBy === 'price-low') {
    sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price-high') {
    sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sortBy === 'rating') {
    sortedProducts.sort((a, b) => (b.stars || b.rating || 0) - (a.stars || a.rating || 0));
  } else {
    sortedProducts = sortByPopularity(enrichedProducts);
  }
  
  return {
    products: sortedProducts,
    results: sortedProducts, // Backward compatibility
    cacheStats: { hits: cacheHits, misses: cacheMisses },
    ...additionalData
  };
};

// ============================================================================
// SHARED CATEGORY BATCH SEARCH UTILITY
// ============================================================================

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
      const actualPage = page + Math.floor(index / 3);
      
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(category)}&page=${actualPage}&retailer=amazon`;
      
      if (priceFilter?.max) {
        searchUrl += `&max_price=${priceFilter.max}&price_max=${priceFilter.max}`;
      }
      if (priceFilter?.min) {
        searchUrl += `&min_price=${priceFilter.min}&price_min=${priceFilter.min}`;
      }
      
      console.log(`Searching ${batchName} category: ${category} (page ${actualPage})`);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        const startIndex = page === 1 ? 0 : (page - 1) * 2;
        const endIndex = startIndex + productsPerCategory;
        let categoryResults = data.results.slice(startIndex, endIndex);
        
        // Price filtering
        if (priceFilter?.max) {
          categoryResults = categoryResults.filter((product: any) => {
            let price = 0;
            if (product.price) {
              if (typeof product.price === 'string') {
                const cleanPrice = product.price.replace(/[$,]/g, '');
                const numPrice = parseFloat(cleanPrice);
                price = numPrice > 100 ? numPrice / 100 : numPrice;
              } else if (typeof product.price === 'number') {
                price = product.price > 100 ? product.price / 100 : product.price;
              }
            } else if (product.price_amount) {
              price = product.price_amount > 100 ? product.price_amount / 100 : product.price_amount;
            } else if (product.price_cents) {
              price = product.price_cents / 100;
            }
            
            const isUnderBudget = price > 0 && price <= priceFilter.max!;
            const meetsMinimum = !priceFilter.min || price >= priceFilter.min;
            return isUnderBudget && meetsMinimum;
          });
        }
        
        const processedResults = categoryResults.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          
          // Normalize price from cents to dollars
          let normalizedPrice = product.price;
          if (typeof product.price === 'number' && product.price > 100) {
            normalizedPrice = product.price / 100;
          } else if (typeof product.price === 'string') {
            const numericPrice = parseFloat(product.price.replace(/[$,]/g, ''));
            normalizedPrice = numericPrice > 100 ? numericPrice / 100 : numericPrice;
          }
          
          return {
            ...product,
            ...bestSellerData,
            categorySource: category,
            price: normalizedPrice,
            image: product.image,
            main_image: product.main_image, 
            images: product.images,
            additional_images: product.additional_images,
            thumbnail: product.thumbnail,
            image_url: product.image_url
          };
        });
        
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
      products: paginatedResults,
      results: paginatedResults,
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

// Brand category mappings for multi-category brand searches
const BRAND_CATEGORY_MAPPINGS: Record<string, string[]> = {
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
const searchBrandCategories = async (
  api_key: string, 
  brandName: string, 
  page: number = 1, 
  limit: number = 20, 
  priceFilter?: { min?: number; max?: number }
) => {
  console.log(`Starting brand category search for: ${brandName}`);
  
  const brandKey = brandName.toLowerCase().replace(/\s+/g, '');
  const categories = BRAND_CATEGORY_MAPPINGS[brandKey];
  
  if (!categories) {
    console.log(`No category mapping found for brand: ${brandName}, using fallback search`);
    try {
      const response = await fetch(
        `https://api.zinc.io/v1/search?query=${encodeURIComponent(brandName)}&page=${page}&retailer=amazon`, 
        {
          method: 'GET',
          headers: { 'Authorization': 'Basic ' + btoa(`${api_key}:`) }
        }
      );
      const data = await response.json();
      
      let filteredResults = data.results || [];
      if (filteredResults.length > 0) {
        filteredResults = filteredResults.filter((product: any) => {
          const productBrand = (product.brand || '').toLowerCase();
          const targetBrand = brandName.toLowerCase();
          return productBrand.includes(targetBrand) || targetBrand.includes(productBrand);
        });
      }
      
      return { products: filteredResults, results: filteredResults, total: filteredResults.length };
    } catch (error) {
      console.error(`Fallback search failed for ${brandName}:`, error);
      return { results: [], total: 0 };
    }
  }
  
  const categoryResults = await searchCategoryBatch(api_key, categories, `${brandName} products`, page, limit, priceFilter);
  
  if (categoryResults.results && categoryResults.results.length > 0) {
    const filteredResults = categoryResults.results.filter((product: any) => {
      const productBrand = (product.brand || '').toLowerCase().trim();
      const targetBrand = brandName.toLowerCase().trim();
      return productBrand === targetBrand || productBrand.includes(targetBrand) || targetBrand.includes(productBrand);
    });
    
    console.log(`Brand filtering complete: ${filteredResults.length} of ${categoryResults.results.length} products match brand "${brandName}"`);
    
    if (filteredResults.length === 0) {
      try {
        const fallbackCategories = categories.map(cat => `${brandName.toLowerCase()} ${cat}`);
        const fallbackResults = await searchCategoryBatch(api_key, fallbackCategories, `${brandName} fallback`, page, limit, priceFilter);
        
        if (fallbackResults.results && fallbackResults.results.length > 0) {
          const fallbackFiltered = fallbackResults.results.filter((product: any) => {
            const productBrand = (product.brand || '').toLowerCase().trim();
            const targetBrand = brandName.toLowerCase().trim();
            return productBrand === targetBrand || productBrand.includes(targetBrand);
          });
          
          return { ...categoryResults, results: fallbackFiltered, total: fallbackFiltered.length };
        }
      } catch (error) {
        console.error(`Fallback search failed:`, error);
      }
    }
    
    return { ...categoryResults, results: filteredResults, total: filteredResults.length };
  }
  
  return categoryResults;
};

// ============================================================================
// MAIN REQUEST HANDLER
// ============================================================================

serve(async (req) => {
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (method === 'POST') {
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
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log('✅ Using Zinc API key from environment');
    
    const supabase = getSupabaseClient();
    
    // Parse request body - support both new category param and legacy boolean flags
    const requestBody = await req.json();
    const {
      query,
      retailer = "amazon",
      page = 1,
      limit = 20,
      category: requestedCategory, // NEW: single category parameter
      // Legacy boolean flags (backward compatibility)
      luxuryCategories = false,
      giftsForHer = false,
      giftsForHim = false,
      giftsUnder50 = false,
      bestSelling = false,
      electronics = false,
      brandCategories = false,
      filters = {}
    } = requestBody;
    
    // Determine active category from new param OR legacy flags
    let activeCategory: string | null = requestedCategory || null;
    
    if (!activeCategory) {
      // Check legacy boolean flags
      for (const [legacyFlag, categoryKey] of Object.entries(LEGACY_FLAG_TO_CATEGORY)) {
        if (requestBody[legacyFlag]) {
          activeCategory = categoryKey;
          console.log(`📦 Legacy flag "${legacyFlag}" mapped to category "${categoryKey}"`);
          break;
        }
      }
    }
    
    // Check if this is a "default" load with no specific query or category
    const hasNoSearchIntent = !query && !activeCategory && !brandCategories;
    
    // Default to best selling when no search intent
    if (hasNoSearchIntent) {
      activeCategory = 'best-selling';
      console.log('📦 No search intent detected, defaulting to best selling products');
    }
    
    // Extract price filters
    const priceFilter = {
      min: filters.min_price || filters.minPrice,
      max: filters.max_price || filters.maxPrice
    };
    
    const sortBy = filters.sortBy || 'popularity';
    
    console.log(`Request: category="${activeCategory}", query="${query}", priceFilter:`, priceFilter);
    
    // Track search trend for Nicole AI (async, non-blocking)
    if (query) {
      trackSearchTrend(supabase, query);
    }
    
    try {
      // ====================================================================
      // UNIFIED CATEGORY HANDLER - Replaces 6 separate if-blocks
      // ====================================================================
      if (activeCategory && CATEGORY_REGISTRY[activeCategory]) {
        const categoryConfig = CATEGORY_REGISTRY[activeCategory];
        console.log(`Processing category "${activeCategory}" (${categoryConfig.name})`);
        
        // Merge category-specific price limits with request filters
        const effectivePriceFilter = {
          min: priceFilter.min || categoryConfig.priceMin,
          max: categoryConfig.priceMax 
            ? Math.min(priceFilter.max || categoryConfig.priceMax, categoryConfig.priceMax)
            : priceFilter.max
        };
        
        // Execute batch search using category queries
        const categoryData = await searchCategoryBatch(
          api_key, 
          categoryConfig.queries, 
          categoryConfig.name, 
          page, 
          limit, 
          effectivePriceFilter
        );
        
        // Use unified processor for caching, enrichment, and sorting
        const response = await processAndReturnResults(
          supabase,
          categoryData.results,
          activeCategory,
          sortBy,
          {
            total: categoryData.total,
            hasMore: categoryData.hasMore,
            currentPage: categoryData.currentPage,
            categoryBatch: true
          }
        );
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle brand categories search
      if (brandCategories && query) {
        console.log(`Processing brand categories request for: ${query}`);
        const brandData = await searchBrandCategories(api_key, query, page, limit, priceFilter);
        
        const response = await processAndReturnResults(
          supabase,
          brandData.results,
          query,
          sortBy,
          { total: brandData.total }
        );
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // ====================================================================
      // REGULAR SEARCH HANDLER (with Phases 2-5 enhancements)
      // ====================================================================
      
      // Extract user_id for personalization (Phase 5)
      const userId = requestBody.user_id;
      
      // CACHE-FIRST LOOKUP (with fuzzy matching - Phase 2)
      const cacheResult = await getCachedProductsForQuery(supabase, query, limit);
      
      if (cacheResult && cacheResult.products && cacheResult.products.length > 0) {
        console.log(`🎯 Returning ${cacheResult.products.length} cached products for "${query}" - Zinc API call SKIPPED ($0.00)`);
        
        let sortedProducts = [...cacheResult.products];
        if (sortBy === 'price-low') {
          sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-high') {
          sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === 'rating') {
          sortedProducts.sort((a, b) => (b.stars || b.rating || 0) - (a.stars || a.rating || 0));
        } else {
          sortedProducts = sortByPopularity(cacheResult.products);
        }
        
        // Apply personalization if user_id provided (Phase 5)
        if (userId) {
          sortedProducts = await applyPersonalizedRanking(supabase, sortedProducts, userId);
        }
        
        // Generate facets from results (Phase 4)
        const facets = generateFacetsFromResults(sortedProducts);
        
        return new Response(JSON.stringify({
          products: sortedProducts,
          results: sortedProducts,
          total: sortedProducts.length,
          originalTotal: sortedProducts.length,
          fromCache: true,
          fuzzyMatched: cacheResult.fuzzyMatched || false,
          suggestedCorrection: cacheResult.suggestedCorrection,
          cacheStats: { hits: sortedProducts.length, misses: 0 },
          facets
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Cache miss - proceed with Zinc API call
      console.log(`⏳ Cache miss for "${query}" - calling Zinc API ($0.01)`);
      
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=${retailer}`;
      
      if (filters?.min_price) searchUrl += `&min_price=${filters.min_price}`;
      if (filters?.max_price) searchUrl += `&max_price=${filters.max_price}`;
      
      console.log('🎯 Zinc API URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Authorization': 'Basic ' + btoa(`${api_key}:`) }
      });
  
      const data = await response.json();
      
      // Apply post-search filters
      let filteredResults = data.results || [];
      
      // Price filtering
      if ((filters?.min_price || filters?.max_price) && filteredResults.length > 0) {
        const minPrice = filters.min_price;
        const maxPrice = filters.max_price;
        
        filteredResults = filteredResults.filter(product => {
          const price = product.price;
          if (!price) return true;
          
          const priceInDollars = typeof price === 'number' ? price : parseFloat(price) || 0;
          
          let passesFilter = true;
          if (minPrice && priceInDollars < minPrice) passesFilter = false;
          if (maxPrice && priceInDollars > maxPrice) passesFilter = false;
          
          return passesFilter;
        });
        
        console.log(`🎯 Post-search price filtering: ${data.results.length} → ${filteredResults.length} products`);
      }
      
      // Universal relevance filter
      if (query && filteredResults.length > 0) {
        const searchTerms = query.toLowerCase()
          .split(/\s+/)
          .filter(term => term.length >= 3);
        
        if (searchTerms.length > 0) {
          const beforeCount = filteredResults.length;
          filteredResults = filteredResults.filter((product: any) => {
            const title = (product.title || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();
            
            return searchTerms.some(term => 
              title.includes(term) || category.includes(term) || brand.includes(term)
            );
          });
          
          console.log(`🎯 Relevance filter: ${beforeCount} → ${filteredResults.length} products`);
        }
      }
      
      // Unsupported product filter
      if (filteredResults && filteredResults.length > 0) {
        const beforeUnsupportedFilter = filteredResults.length;
        let blockedCount = 0;
        
        filteredResults = filteredResults.filter((product: any) => {
          if (product.digital === true || product.fresh === true || product.pantry === true) {
            blockedCount++;
            return false;
          }
          
          const title = (product.title || '').toLowerCase();
          const category = (product.category || product.categories?.[0] || '').toLowerCase();
          
          if (/gift\s*card|e-?gift|egift/i.test(title)) {
            blockedCount++;
            return false;
          }
          
          if (/kindle\s*edition|\[ebook\]|digital\s*(download|code)|online\s*game\s*code|pc\s*download/i.test(title)) {
            blockedCount++;
            return false;
          }
          
          if (/kindle\s*store|digital\s*music|digital\s*video/i.test(category)) {
            blockedCount++;
            return false;
          }
          
          return true;
        });
        
        if (blockedCount > 0) {
          console.log(`🎯 Unsupported product filter: ${beforeUnsupportedFilter} → ${filteredResults.length} products (blocked ${blockedCount})`);
        }
      }

      // Normalize prices
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
            image: product.image,
            main_image: product.main_image,
            images: product.images,
            additional_images: product.additional_images,
            thumbnail: product.thumbnail,
            image_url: product.image_url
          };
        });
      }

      // PHASE 3: Handle zero results with fallbacks
      if (!filteredResults || filteredResults.length === 0) {
        console.log(`⚠️ Zero results for "${query}" - fetching fallbacks`);
        const fallbacks = await getZeroResultFallbacks(supabase, query, 8);
        
        return new Response(JSON.stringify({
          products: [],
          results: [],
          total: 0,
          zeroResults: true,
          suggestedQueries: fallbacks.suggestedQueries,
          fallbackProducts: fallbacks.fallbackProducts,
          cacheStats: { hits: 0, misses: 1 }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Use unified processor for regular search results
      const searchResponse = await processAndReturnResults(
        supabase,
        filteredResults,
        query,
        sortBy,
        {
          total: filteredResults.length,
          originalTotal: data.total || 0,
          priceFiltered: !!(filters?.min_price || filters?.max_price)
        }
      );

      // Add facets to response (Phase 4)
      const facets = generateFacetsFromResults(searchResponse.products || filteredResults);
      
      // Apply personalization if user_id provided (Phase 5)
      let finalProducts = searchResponse.products;
      if (userId && finalProducts.length > 0) {
        finalProducts = await applyPersonalizedRanking(supabase, finalProducts, userId);
      }

      return new Response(JSON.stringify({
        ...searchResponse,
        products: finalProducts,
        results: finalProducts,
        facets
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
          products: [],
          results: []
        }), 
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }
  
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }), 
    { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
