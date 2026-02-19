// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Import from shared modules
import { CATEGORY_REGISTRY, LEGACY_FLAG_TO_CATEGORY, BRAND_CATEGORY_MAPPINGS } from '../shared/categoryRegistry.ts';
import { applyBrandAwareFilter, parseSearchQuery, COMMON_BRANDS } from '../shared/brandAwareFilter.ts';
import { filterUnsupportedProducts } from '../shared/unsupportedProductFilter.ts';
import { generateFacetsFromResults } from '../shared/facetGenerator.ts';

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
 * Get Zinc API key from environment variables
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
 * Enrich search results with cached product data (ratings, reviews, images)
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

    const cacheMap = new Map();
    (cachedProducts || []).forEach((cached: any) => {
      cacheMap.set(cached.product_id, cached);
    });

    let cacheHits = 0;
    let cacheMisses = 0;

    const enrichedProducts = products.map(product => {
      const productId = product.product_id || product.asin;
      const cached = cacheMap.get(productId);

      if (cached && cached.metadata) {
        cacheHits++;
        const metadata = cached.metadata;
        
        return {
          ...product,
          stars: metadata.stars || product.stars,
          review_count: metadata.review_count || product.review_count,
          num_sales: metadata.num_sales || product.num_sales || null,
          images: metadata.images || product.images,
          main_image: metadata.main_image || product.main_image || product.image,
          is_cached: true,
          view_count: cached.view_count || 0,
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
 */
const cacheSearchResults = async (supabase: any, products: any[], sourceQuery?: string) => {
  if (!supabase || !products || products.length === 0) return;

  try {
    const productsToCache = products.map(p => {
      let price = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0;
      
      // Price already normalized by normalizePrices() before caching
      // Do NOT divide again - that was causing $300 items to cache as $3.00

      return {
        product_id: p.product_id || p.asin,
        title: p.title,
        price,
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
      };
    }).filter(p => p.product_id && p.price > 0);

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
 * Check if we have enough cached products for a query (cache-first lookup)
 * Uses AND-first strategy for multi-word queries, falling back to OR if needed
 */
const getCachedProductsForQuery = async (supabase: any, query: string, limit: number) => {
  if (!supabase || !query || query.length < 2) return null;

  try {
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length >= 3);
    
    if (searchTerms.length === 0) return null;

    const threshold = Math.ceil(limit * 0.8);
    
    // Step 1: For multi-word queries, try AND logic first (products must contain ALL terms)
    if (searchTerms.length >= 2) {
      console.log(`🔍 AND-first search for "${query}" with terms: [${searchTerms.join(', ')}]`);
      
      // Build query with chained ilike filters for AND logic
      let andQuery = supabase
        .from('products')
        .select('*');
      
      // Chain all search terms with AND logic
      for (const term of searchTerms) {
        andQuery = andQuery.ilike('title', `%${term}%`);
      }
      
      const { data: andResults, error: andError } = await andQuery
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(limit);
      
      if (!andError && andResults && andResults.length >= threshold) {
        console.log(`✅ AND Cache HIT: Found ${andResults.length} products matching ALL terms for "${query}" (threshold: ${threshold})`);
        
        return {
          products: andResults.map((p: any) => transformCachedProduct(p)),
          fuzzyMatched: false,
          suggestedCorrection: null,
          matchType: 'and'
        };
      }
      
      // Return partial AND results so caller can supplement with Zinc
      if (!andError && andResults && andResults.length > 0) {
        console.log(`⏳ AND search found ${andResults.length} products (need ${threshold}) - returning partial for supplement`);
        return {
          products: andResults.map((p: any) => transformCachedProduct(p)),
          fuzzyMatched: false,
          suggestedCorrection: null,
          matchType: 'and-partial',
          isPartial: true
        };
      }
      
      console.log(`⏳ AND search found 0 products, trying OR fallback...`);
    }

    // Step 2: Fall back to OR logic (products contain ANY term)
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

    if (cachedProducts && cachedProducts.length >= threshold) {
      console.log(`✅ OR Cache HIT: Found ${cachedProducts.length} cached products for "${query}" (threshold: ${threshold})`);
      
      return {
        products: cachedProducts.map((p: any) => transformCachedProduct(p)),
        fuzzyMatched: false,
        suggestedCorrection: null,
        matchType: 'or'
      };
    }

    // Step 3: Try fuzzy matching if exact match fails
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
        
        const suggestedCorrection = fuzzyResults[0]?.title 
          ? extractCorrectionFromTitle(fuzzyResults[0].title, query)
          : null;
        
        return {
          products: fuzzyResults.map((p: any) => transformCachedProduct(p)),
          fuzzyMatched: true,
          suggestedCorrection,
          matchType: 'fuzzy'
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

const extractCorrectionFromTitle = (title: string, originalQuery: string) => {
  const words = title.toLowerCase().split(/\s+/).slice(0, 3);
  const queryWords = originalQuery.toLowerCase().split(/\s+/);
  
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
 * Get fallback products for zero results
 */
const getZeroResultFallbacks = async (supabase: any, query: string, limit: number = 8) => {
  if (!supabase) return { suggestedQueries: [], fallbackProducts: [] };

  try {
    const { data: similarQueries } = await supabase
      .from('search_trends')
      .select('search_query, search_count')
      .order('search_count', { ascending: false })
      .limit(5);

    const { data: fallbackProducts } = await supabase
      .from('products')
      .select('product_id, title, price, image_url, brand, metadata, view_count')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

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
 * Apply personalized ranking boost
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

    return products.map(product => {
      let personalizedBoost = 0;
      const title = (product.title || '').toLowerCase();

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
 * Sort products by popularity score
 */
const sortByPopularity = (products: any[]) => {
  return [...products].sort((a, b) => {
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
      
      console.log(`📊 Search trend incremented: "${normalizedQuery}" → ${existing.search_count + 1}`);
    } else {
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

/**
 * Unified processor for all category and search results
 */
const processAndReturnResults = async (
  supabase: any,
  rawResults: any[],
  sourceQuery: string,
  sortBy: string = 'popularity',
  additionalData: Record<string, any> = {}
) => {
  const processedResults = rawResults.map((product: any) => {
    const bestSellerData = processBestSellerData(product);
    return { ...product, ...bestSellerData };
  });
  
  EdgeRuntime.waitUntil(cacheSearchResults(supabase, processedResults, sourceQuery));
  
  const { products: enrichedProducts, cacheHits, cacheMisses } = 
    await enrichWithCachedData(supabase, processedResults);
  
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
    results: sortedProducts,
    cacheStats: { hits: cacheHits, misses: cacheMisses },
    ...additionalData
  };
};

/**
 * Shared category batch search utility
 */
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

/**
 * Apply clothing-specific filters to products (waist, inseam, color, size, gender)
 * These filters work by matching against product titles and attributes
 */
const applyClothingFilters = (products: any[], clothingFilters: {
  waist: string[];
  inseam: string[];
  size: string[];
  color: string[];
  gender: string[];
}): any[] => {
  if (!products || products.length === 0) return products;
  
  const hasFilters = clothingFilters.waist.length > 0 || 
                     clothingFilters.inseam.length > 0 || 
                     clothingFilters.size.length > 0 ||
                     clothingFilters.color.length > 0 ||
                     clothingFilters.gender.length > 0;
  
  if (!hasFilters) return products;
  
  let filtered = [...products];
  const originalCount = filtered.length;
  
  // Filter by waist size (e.g., "36", "32")
  if (clothingFilters.waist.length > 0) {
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      const variant = (p.variant_specifics || []).map((v: any) => `${v.dimension || ''} ${v.value || ''}`.toLowerCase()).join(' ');
      // Also check metadata for size info
      const metadata = typeof p.metadata === 'object' ? JSON.stringify(p.metadata || {}).toLowerCase() : '';
      const combinedText = `${title} ${variant} ${metadata}`;
      
      const matchResult = clothingFilters.waist.some((w: string) => {
        const waistNum = w.replace(/['"]/g, '').trim();
        // Match patterns like "36W", "W36", "36x", "waist 36", "36 waist", ", 36W x"
        const patterns = [
          new RegExp(`\\b${waistNum}w\\b`, 'i'),
          new RegExp(`\\bw${waistNum}\\b`, 'i'),
          new RegExp(`\\b${waistNum}x\\d+`, 'i'),  // "36x30" format
          new RegExp(`waist\\s*${waistNum}`, 'i'),
          new RegExp(`${waistNum}\\s*waist`, 'i'),
          new RegExp(`,\\s*${waistNum}w`, 'i'),   // ", 36W x" format
          new RegExp(`size[:\\s]*${waistNum}`, 'i'),  // "size: 36" format
          new RegExp(`\\b${waistNum}\\s*x\\s*\\d+`, 'i'),  // "36 x 30" with spaces
        ];
        return patterns.some(pattern => pattern.test(combinedText));
      });
      
      if (!matchResult) {
        console.log(`📏 Waist filter rejected: "${title.substring(0, 60)}..." (looking for ${clothingFilters.waist.join(',')})`);
      }
      return matchResult;
    });
    console.log(`📏 Waist filter (${clothingFilters.waist.join(',')}): ${originalCount} → ${filtered.length} products`);
  }
  
  // Filter by inseam length (e.g., "30", "32")
  if (clothingFilters.inseam.length > 0) {
    const preInseamCount = filtered.length;
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      const variant = (p.variant_specifics || []).map((v: any) => `${v.dimension || ''} ${v.value || ''}`.toLowerCase()).join(' ');
      
      return clothingFilters.inseam.some((i: string) => {
        const inseamNum = i.replace(/['"]/g, '').trim();
        // Match patterns like "30L", "L30", "x30", "inseam 30", "30 inseam"
        const patterns = [
          new RegExp(`\\b${inseamNum}l\\b`, 'i'),
          new RegExp(`\\bl${inseamNum}\\b`, 'i'),
          new RegExp(`\\d+x${inseamNum}\\b`, 'i'),  // "36x30" format
          new RegExp(`inseam\\s*${inseamNum}`, 'i'),
          new RegExp(`${inseamNum}\\s*inseam`, 'i'),
          new RegExp(`\\b${inseamNum}"`, 'i')  // "30" format
        ];
        return patterns.some(pattern => pattern.test(title) || pattern.test(variant));
      });
    });
    console.log(`📏 Inseam filter (${clothingFilters.inseam.join(',')}): ${preInseamCount} → ${filtered.length} products`);
  }
  
  // Filter by color
  if (clothingFilters.color.length > 0) {
    const preColorCount = filtered.length;
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      const productColor = (p.color || '').toLowerCase();
      const variant = (p.variant_specifics || []).map((v: any) => `${v.dimension || ''} ${v.value || ''}`.toLowerCase()).join(' ');
      
      return clothingFilters.color.some((c: string) => {
        const colorLower = c.toLowerCase().trim();
        return title.includes(colorLower) || 
               productColor.includes(colorLower) || 
               variant.includes(colorLower);
      });
    });
    console.log(`🎨 Color filter (${clothingFilters.color.join(',')}): ${preColorCount} → ${filtered.length} products`);
  }
  
  // Filter by size (for non-pants like shirts: S, M, L, XL)
  if (clothingFilters.size.length > 0) {
    const preSizeCount = filtered.length;
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      const variant = (p.variant_specifics || []).map((v: any) => `${v.dimension || ''} ${v.value || ''}`.toLowerCase()).join(' ');
      
      return clothingFilters.size.some((s: string) => {
        const sizeLower = s.toLowerCase().trim();
        // Match exact size codes (S, M, L, XL, XXL)
        const patterns = [
          new RegExp(`\\b${sizeLower}\\b`, 'i'),
          new RegExp(`size\\s*${sizeLower}`, 'i'),
          new RegExp(`${sizeLower}\\s*size`, 'i')
        ];
        return patterns.some(pattern => pattern.test(title) || pattern.test(variant));
      });
    });
    console.log(`📐 Size filter (${clothingFilters.size.join(',')}): ${preSizeCount} → ${filtered.length} products`);
  }
  
  // Filter by gender (men, women, unisex)
  if (clothingFilters.gender.length > 0) {
    const preGenderCount = filtered.length;
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      
      return clothingFilters.gender.some((g: string) => {
        const genderLower = g.toLowerCase().trim();
        // Match gender patterns
        const genderPatterns: Record<string, RegExp[]> = {
          'men': [/\bmen'?s?\b/i, /\bmale\b/i, /\bmasculine\b/i],
          'women': [/\bwomen'?s?\b/i, /\bfemale\b/i, /\bfeminine\b/i, /\bladies\b/i],
          'unisex': [/\bunisex\b/i, /\ball\b/i]
        };
        const patterns = genderPatterns[genderLower] || [new RegExp(`\\b${genderLower}\\b`, 'i')];
        return patterns.some(pattern => pattern.test(title) || pattern.test(category));
      });
    });
    console.log(`👤 Gender filter (${clothingFilters.gender.join(',')}): ${preGenderCount} → ${filtered.length} products`);
  }
  
  console.log(`📏 Total clothing filter result: ${originalCount} → ${filtered.length} products`);
  return filtered;
};

/**
 * Normalize prices from Zinc API response
 */
const normalizePrices = (products: any[]) => {
  if (!products || !Array.isArray(products)) return products;
  
  return products.map((product: any) => {
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
    
    const requestBody = await req.json();
    const {
      query,
      retailer = "amazon",
      page = 1,
      limit = 20,
      category: requestedCategory,
      luxuryCategories = false,
      giftsForHer = false,
      giftsForHim = false,
      giftsUnder50 = false,
      bestSelling = false,
      electronics = false,
      brandCategories = false,
      filters = {},
      skip_cache = false
    } = requestBody;
    
    let activeCategory: string | null = requestedCategory || null;
    
    if (!activeCategory) {
      for (const [legacyFlag, categoryKey] of Object.entries(LEGACY_FLAG_TO_CATEGORY)) {
        if (requestBody[legacyFlag]) {
          activeCategory = categoryKey;
          console.log(`📦 Legacy flag "${legacyFlag}" mapped to category "${categoryKey}"`);
          break;
        }
      }
    }
    
    const hasNoSearchIntent = !query && !activeCategory && !brandCategories;
    
    if (hasNoSearchIntent) {
      activeCategory = 'best-selling';
      console.log('📦 No search intent detected, defaulting to best selling products');
    }
    
    const priceFilter = {
      min: filters.min_price || filters.minPrice,
      max: filters.max_price || filters.maxPrice
    };
    
    const sortBy = filters.sortBy || 'popularity';
    
    // Extract clothing-specific filters for post-search filtering
    const clothingFilters = {
      waist: filters.waist || [],
      inseam: filters.inseam || [],
      size: filters.size || [],
      color: filters.color || [],
      gender: filters.gender || []
    };
    const hasClothingFilters = clothingFilters.waist.length > 0 || 
                                clothingFilters.inseam.length > 0 || 
                                clothingFilters.size.length > 0 ||
                                clothingFilters.color.length > 0 ||
                                clothingFilters.gender.length > 0;
    
    if (hasClothingFilters) {
      console.log(`📏 Clothing filters active:`, clothingFilters);
    }
    
    console.log(`Request: category="${activeCategory}", query="${query}", priceFilter:`, priceFilter);
    
    if (query) {
      trackSearchTrend(supabase, query);
    }
    
    try {
      // UNIFIED CATEGORY HANDLER
      if (activeCategory && CATEGORY_REGISTRY[activeCategory]) {
        const categoryConfig = CATEGORY_REGISTRY[activeCategory];
        console.log(`Processing category "${activeCategory}" (${categoryConfig.name})`);
        
        const effectivePriceFilter = {
          min: priceFilter.min || categoryConfig.priceMin,
          max: categoryConfig.priceMax 
            ? Math.min(priceFilter.max || categoryConfig.priceMax, categoryConfig.priceMax)
            : priceFilter.max
        };
        
        const categoryData = await searchCategoryBatch(
          api_key, 
          categoryConfig.queries, 
          categoryConfig.name, 
          page, 
          limit, 
          effectivePriceFilter
        );
        
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
      // REGULAR SEARCH HANDLER
      // ====================================================================
      
      const userId = requestBody.user_id;
      
      // CACHE-FIRST LOOKUP (skip if explicitly requested)
      const cacheResult = skip_cache ? null : await getCachedProductsForQuery(supabase, query, limit);
      
      if (skip_cache) {
        console.log(`⏭️ Cache bypassed for "${query}" (skip_cache=true)`);
      }
      
      if (cacheResult && cacheResult.products && cacheResult.products.length > 0) {
        console.log(`🎯 Cache hit: ${cacheResult.products.length} products for "${query}"`);
        
        // Apply brand-aware relevance filter to cached results
        let sortedProducts = applyBrandAwareFilter([...cacheResult.products], query);
        
        // ============================================================
        // SMART THRESHOLD: Fall back to Zinc API when:
        // 1. Brand filter removed ALL products, OR
        // 2. Brand-specific search returns sparse results (< 8 products)
        // This accelerates organic catalog growth for brand searches
        // ============================================================
        const MIN_RESULTS_THRESHOLD = Math.max(limit, 20);
        const needsSupplement = sortedProducts.length < MIN_RESULTS_THRESHOLD;
        
        if (sortedProducts.length === 0 || needsSupplement) {
          if (sortedProducts.length > 0) {
            console.log(`🎯 Search "${query}" has only ${sortedProducts.length} results (threshold: ${MIN_RESULTS_THRESHOLD}) - supplementing with Zinc API`);
          } else {
            console.log(`🎯 Brand filter removed all ${cacheResult.products.length} cached products for "${query}" - falling back to Zinc API`);
          }
          // Save cached products for merging after Zinc call
          var cachedProductsForMerge = sortedProducts.length > 0 ? [...sortedProducts] : [];
          // DON'T return sparse/empty - continue to Zinc API call below
        } else {
          // We have relevant cached products, apply sorting and return
          if (sortBy === 'price-low') {
            sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
          } else if (sortBy === 'price-high') {
            sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
          } else if (sortBy === 'rating') {
            sortedProducts.sort((a, b) => (b.stars || b.rating || 0) - (a.stars || a.rating || 0));
          } else {
            sortedProducts = sortByPopularity(sortedProducts);
          }
          
          // Apply clothing-specific filters (waist, inseam, color, size, gender)
          if (hasClothingFilters) {
            sortedProducts = applyClothingFilters(sortedProducts, clothingFilters);
          }
          
          if (userId) {
            sortedProducts = await applyPersonalizedRanking(supabase, sortedProducts, userId);
          }
          
          const facets = generateFacetsFromResults(sortedProducts);
          
          return new Response(JSON.stringify({
            products: sortedProducts,
            results: sortedProducts,
            total: sortedProducts.length,
            originalTotal: sortedProducts.length,
            fromCache: true,
            hasMore: true, // Cache is always a subset — more exist on Amazon
            fuzzyMatched: cacheResult.fuzzyMatched || false,
            suggestedCorrection: cacheResult.suggestedCorrection,
            cacheStats: { hits: sortedProducts.length, misses: 0 },
            facets
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      // Cache miss OR brand filter removed all results - call Zinc API
      // For skip_cache ("Find more"), request page 2 to get genuinely different products
      const zincPage = skip_cache ? 2 : page;
      console.log(`⏳ Calling Zinc API for "${query}" page=${zincPage} ($0.01)`);
      
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${zincPage}&retailer=${retailer}`;
      
      if (filters?.min_price) searchUrl += `&min_price=${filters.min_price}`;
      if (filters?.max_price) searchUrl += `&max_price=${filters.max_price}`;
      
      console.log('🎯 Zinc API URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Authorization': 'Basic ' + btoa(`${api_key}:`) }
      });
  
      const data = await response.json();
      
      let filteredResults = data.results || [];
      
      // Price filtering - Zinc returns prices in CENTS, so convert filter thresholds
      if ((filters?.min_price || filters?.max_price) && filteredResults.length > 0) {
        // Convert dollar thresholds to cents to match Zinc API response format
        const minPriceInCents = filters.min_price ? filters.min_price * 100 : null;
        const maxPriceInCents = filters.max_price ? filters.max_price * 100 : null;
        
        filteredResults = filteredResults.filter(product => {
          const price = product.price;
          if (!price) return true;
          
          // Zinc prices are in cents (e.g., 3374 = $33.74)
          const priceInCents = typeof price === 'number' ? price : parseFloat(price) || 0;
          
          let passesFilter = true;
          if (minPriceInCents && priceInCents < minPriceInCents) passesFilter = false;
          if (maxPriceInCents && priceInCents > maxPriceInCents) passesFilter = false;
          
          return passesFilter;
        });
        
        console.log(`🎯 Post-search price filtering: ${data.results.length} → ${filteredResults.length} products (max: $${filters.max_price || 'none'})`);
      }
      
      // Apply brand-aware filter using shared module (NO DUPLICATE CODE)
      if (query && filteredResults.length > 0) {
        const beforeCount = filteredResults.length;
        filteredResults = applyBrandAwareFilter(filteredResults, query);
        console.log(`🎯 Brand-aware filter applied: ${beforeCount} → ${filteredResults.length} products`);
      }
      
      // Apply unsupported product filter using shared module
      if (filteredResults && filteredResults.length > 0) {
        const { filteredProducts, blockedCount } = filterUnsupportedProducts(filteredResults);
        filteredResults = filteredProducts;
      }

      // Normalize prices BEFORE caching (Zinc returns cents, we store dollars)
      // This MUST happen before processAndReturnResults which caches the data
      filteredResults = normalizePrices(filteredResults);
      console.log(`💰 Normalized ${filteredResults.length} product prices from cents to dollars`);

      // Handle zero results with fallbacks
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

      // MERGE: If we have cached products from sparse results, combine with Zinc results
      if (typeof cachedProductsForMerge !== 'undefined' && cachedProductsForMerge.length > 0) {
        const cachedIds = new Set(cachedProductsForMerge.map((p: any) => p.product_id || p.asin));
        const newZincProducts = filteredResults.filter((p: any) => !cachedIds.has(p.product_id || p.asin));
        console.log(`🔀 Merging ${cachedProductsForMerge.length} cached + ${newZincProducts.length} new Zinc products`);
        filteredResults = [...cachedProductsForMerge, ...newZincProducts].slice(0, limit);
      }

      // Use unified processor for regular search results
      const zincTotal = data.total || 0;
      const searchResponse = await processAndReturnResults(
        supabase,
        filteredResults,
        query,
        sortBy,
        {
          total: filteredResults.length,
          originalTotal: zincTotal,
          hasMore: zincTotal > filteredResults.length,
          priceFiltered: !!(filters?.min_price || filters?.max_price)
        }
      );

      // Add facets to response
      const facets = generateFacetsFromResults(searchResponse.products || filteredResults);
      
      // Apply clothing-specific filters (waist, inseam, color, size, gender)
      let finalProducts = searchResponse.products;
      if (hasClothingFilters && finalProducts.length > 0) {
        finalProducts = applyClothingFilters(finalProducts, clothingFilters);
      }
      
      // Apply personalization if user_id provided
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
