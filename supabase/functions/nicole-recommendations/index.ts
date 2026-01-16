import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  userId?: string;
  recentSearches: string[];
  recentlyViewedIds: string[];
  wishlistTags: string[];
  limit?: number;
}

interface ScoredProduct {
  product: any;
  score: number;
  matchReason: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RecommendationRequest = await req.json();
    const { 
      userId, 
      recentSearches = [], 
      recentlyViewedIds = [], 
      wishlistTags = [],
      limit = 16
    } = body;

    console.log('📊 Nicole Recommendations Request:', {
      userId: userId ? 'authenticated' : 'anonymous',
      recentSearches: recentSearches.length,
      recentlyViewedIds: recentlyViewedIds.length,
      wishlistTags: wishlistTags.length
    });

    const allProducts: ScoredProduct[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // ===== STRATEGY 1: User's Recent Searches =====
    if (recentSearches.length > 0) {
      console.log('🔍 Searching products from user searches:', recentSearches.slice(0, 3));
      
      for (const searchTerm of recentSearches.slice(0, 3)) {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        if (normalizedTerm.length < 2) continue;

        // Query cached products first
        const { data: cachedProducts, error } = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${normalizedTerm}%`)
          .order('view_count', { ascending: false })
          .limit(6);

        if (!error && cachedProducts && cachedProducts.length > 0) {
          cacheHits += cachedProducts.length;
          console.log(`✅ Cache hit for "${searchTerm}": ${cachedProducts.length} products`);
          
          cachedProducts.forEach(product => {
            allProducts.push({
              product: formatProduct(product),
              score: 25, // High score for search-based
              matchReason: [`Matches your search: "${searchTerm}"`]
            });
          });
        } else {
          cacheMisses++;
          console.log(`⚠️ Cache miss for "${searchTerm}" - would trigger Zinc API`);
          // Note: We don't call Zinc directly here to avoid costs
          // The user's actual search will populate the cache
        }
      }
    }

    // ===== STRATEGY 2: Similar to Recently Viewed =====
    if (recentlyViewedIds.length > 0) {
      console.log('👀 Finding similar products to viewed:', recentlyViewedIds.slice(0, 5));
      
      // First get the viewed products to extract categories/brands
      const { data: viewedProducts, error: viewedError } = await supabase
        .from('products')
        .select('category, brand, title')
        .in('product_id', recentlyViewedIds.slice(0, 5));

      if (!viewedError && viewedProducts && viewedProducts.length > 0) {
        const categories = [...new Set(viewedProducts.map(p => p.category).filter(Boolean))];
        const brands = [...new Set(viewedProducts.map(p => p.brand).filter(Boolean))];

        console.log('📂 Extracted categories:', categories);
        console.log('🏷️ Extracted brands:', brands);

        // Find similar products by category
        for (const category of categories.slice(0, 2)) {
          const { data: similarProducts, error } = await supabase
            .from('products')
            .select('*')
            .ilike('category', `%${category}%`)
            .not('product_id', 'in', `(${recentlyViewedIds.join(',')})`)
            .order('view_count', { ascending: false })
            .limit(4);

          if (!error && similarProducts && similarProducts.length > 0) {
            cacheHits += similarProducts.length;
            similarProducts.forEach(product => {
              allProducts.push({
                product: formatProduct(product),
                score: 20, // Good score for similar items
                matchReason: [`Similar to items you viewed in ${category}`]
              });
            });
          }
        }

        // Find similar products by brand
        for (const brand of brands.slice(0, 2)) {
          const { data: brandProducts, error } = await supabase
            .from('products')
            .select('*')
            .ilike('brand', `%${brand}%`)
            .not('product_id', 'in', `(${recentlyViewedIds.join(',')})`)
            .order('view_count', { ascending: false })
            .limit(3);

          if (!error && brandProducts && brandProducts.length > 0) {
            cacheHits += brandProducts.length;
            brandProducts.forEach(product => {
              allProducts.push({
                product: formatProduct(product),
                score: 18, // Good score for same brand
                matchReason: [`More from ${brand}`]
              });
            });
          }
        }
      }
    }

    // ===== STRATEGY 3: Wishlist Tag Matching =====
    if (wishlistTags.length > 0) {
      console.log('🏷️ Finding products matching wishlist tags:', wishlistTags.slice(0, 5));
      
      for (const tag of wishlistTags.slice(0, 3)) {
        const normalizedTag = tag.toLowerCase().trim();
        
        const { data: tagProducts, error } = await supabase
          .from('products')
          .select('*')
          .or(`title.ilike.%${normalizedTag}%,category.ilike.%${normalizedTag}%,brand.ilike.%${normalizedTag}%`)
          .order('view_count', { ascending: false })
          .limit(4);

        if (!error && tagProducts && tagProducts.length > 0) {
          cacheHits += tagProducts.length;
          tagProducts.forEach(product => {
            allProducts.push({
              product: formatProduct(product),
              score: 15, // Moderate score for tag-based
              matchReason: [`Matches your preference: "${tag}"`]
            });
          });
        }
      }
    }

    // ===== STRATEGY 4: Global Trending (Fallback) =====
    console.log('📈 Fetching global trending products');
    
    // Get trending search terms
    const { data: trendingSearches, error: trendError } = await supabase
      .from('search_trends')
      .select('search_query, search_count')
      .gt('search_count', 5)
      .order('search_count', { ascending: false })
      .limit(5);

    if (!trendError && trendingSearches && trendingSearches.length > 0) {
      for (const trend of trendingSearches.slice(0, 3)) {
        const { data: trendingProducts, error } = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${trend.search_query}%`)
          .order('view_count', { ascending: false })
          .limit(4);

        if (!error && trendingProducts && trendingProducts.length > 0) {
          cacheHits += trendingProducts.length;
          trendingProducts.forEach(product => {
            allProducts.push({
              product: formatProduct(product),
              score: 10, // Base score for trending
              matchReason: [`Trending: "${trend.search_query}"`]
            });
          });
        }
      }
    }

    // Also get popular products by view count
    const { data: popularProducts, error: popError } = await supabase
      .from('products')
      .select('*')
      .gt('view_count', 0)
      .order('view_count', { ascending: false })
      .limit(8);

    if (!popError && popularProducts && popularProducts.length > 0) {
      cacheHits += popularProducts.length;
      popularProducts.forEach(product => {
        allProducts.push({
          product: formatProduct(product),
          score: 8, // Base popularity score
          matchReason: ['Popular gift choice']
        });
      });
    }

    // ===== DEDUPLICATION & RANKING =====
    const productMap = new Map<string, ScoredProduct>();
    
    for (const scored of allProducts) {
      const productId = scored.product.product_id;
      if (!productId) continue;
      
      const existing = productMap.get(productId);
      if (existing) {
        // Combine scores and reasons
        existing.score += scored.score;
        existing.matchReason = [...new Set([...existing.matchReason, ...scored.matchReason])];
      } else {
        productMap.set(productId, scored);
      }
    }

    // Apply additional scoring factors
    const scoredProducts = Array.from(productMap.values()).map(sp => {
      let bonusScore = 0;
      
      // Rating bonus
      const stars = sp.product.stars || sp.product.metadata?.stars || 0;
      if (stars >= 4.5) bonusScore += 5;
      else if (stars >= 4.0) bonusScore += 3;
      
      // Review count bonus
      const reviewCount = sp.product.review_count || sp.product.metadata?.review_count || 0;
      if (reviewCount > 1000) bonusScore += 4;
      else if (reviewCount > 100) bonusScore += 2;
      
      // Best seller bonus
      if (sp.product.metadata?.isBestSeller) bonusScore += 5;
      
      sp.score += bonusScore;
      return sp;
    });

    // Sort by score and limit
    const rankedProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // ===== GROUP INTO SECTIONS =====
    const sections = {
      searchBased: rankedProducts
        .filter(sp => sp.matchReason.some(r => r.includes('Matches your search')))
        .slice(0, 6)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] })),
      
      viewedBased: rankedProducts
        .filter(sp => sp.matchReason.some(r => r.includes('Similar to') || r.includes('More from')))
        .slice(0, 6)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] })),
      
      tagBased: rankedProducts
        .filter(sp => sp.matchReason.some(r => r.includes('preference')))
        .slice(0, 4)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] })),
      
      trending: rankedProducts
        .filter(sp => sp.matchReason.some(r => r.includes('Trending') || r.includes('Popular')))
        .slice(0, 6)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] }))
    };

    // Also return a flat mixed list
    const mixedProducts = rankedProducts
      .slice(0, limit)
      .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0], score: sp.score }));

    console.log('📊 Nicole Recommendations Result:', {
      totalCandidates: allProducts.length,
      uniqueProducts: productMap.size,
      returned: mixedProducts.length,
      cacheHits,
      cacheMisses,
      sections: {
        searchBased: sections.searchBased.length,
        viewedBased: sections.viewedBased.length,
        tagBased: sections.tagBased.length,
        trending: sections.trending.length
      }
    });

    return new Response(JSON.stringify({
      success: true,
      products: mixedProducts,
      sections,
      stats: {
        cacheHits,
        cacheMisses,
        totalCandidates: allProducts.length,
        uniqueProducts: productMap.size
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Nicole recommendations error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      sections: { searchBased: [], viewedBased: [], tagBased: [], trending: [] }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to format product data consistently
function formatProduct(dbProduct: any): any {
  const metadata = dbProduct.metadata || {};
  
  return {
    product_id: dbProduct.product_id,
    title: dbProduct.title,
    price: dbProduct.price,
    image: dbProduct.image_url || metadata.main_image || metadata.images?.[0],
    main_image: dbProduct.image_url || metadata.main_image,
    images: metadata.images || [dbProduct.image_url].filter(Boolean),
    brand: dbProduct.brand,
    category: dbProduct.category,
    retailer: dbProduct.retailer || 'amazon',
    stars: metadata.stars || dbProduct.stars,
    rating: metadata.stars || dbProduct.stars,
    review_count: metadata.review_count,
    num_reviews: metadata.review_count,
    view_count: dbProduct.view_count || 0,
    isBestSeller: metadata.isBestSeller || false,
    badgeText: metadata.badgeText,
    metadata
  };
}
