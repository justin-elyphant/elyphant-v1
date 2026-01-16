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
  section: 'search' | 'viewed' | 'tag' | 'trending';
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
    let searchBasedFound = 0;
    let viewedBasedFound = 0;

    // ===== STRATEGY 1: User's Recent Searches =====
    if (recentSearches.length > 0) {
      const uniqueSearches = [...new Set(recentSearches.slice(0, 5))];
      console.log('🔍 Searching products from user searches:', uniqueSearches);
      
      for (const searchTerm of uniqueSearches) {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        if (normalizedTerm.length < 2) continue;

        // Try different search strategies
        // Strategy 1a: Direct title match
        let { data: cachedProducts, error } = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${normalizedTerm}%`)
          .order('view_count', { ascending: false, nullsFirst: false })
          .limit(6);

        // Strategy 1b: If no direct match, try splitting search terms
        if ((!cachedProducts || cachedProducts.length === 0) && normalizedTerm.includes(' ')) {
          const keywords = normalizedTerm.split(' ').filter(k => k.length > 2);
          if (keywords.length > 0) {
            const { data: keywordProducts } = await supabase
              .from('products')
              .select('*')
              .or(keywords.map(k => `title.ilike.%${k}%`).join(','))
              .order('view_count', { ascending: false, nullsFirst: false })
              .limit(6);
            
            if (keywordProducts && keywordProducts.length > 0) {
              cachedProducts = keywordProducts;
            }
          }
        }

        if (!error && cachedProducts && cachedProducts.length > 0) {
          cacheHits += cachedProducts.length;
          searchBasedFound += cachedProducts.length;
          console.log(`✅ Found products for "${searchTerm}": ${cachedProducts.length}`);
          
          cachedProducts.forEach(product => {
            allProducts.push({
              product: formatProduct(product),
              score: 25,
              matchReason: [`Based on "${searchTerm}"`],
              section: 'search'
            });
          });
        } else {
          cacheMisses++;
          console.log(`⚠️ No products found for "${searchTerm}"`);
        }
      }
    }

    // ===== FALLBACK for Search-Based: Use popular products if no search matches =====
    if (searchBasedFound === 0 && recentSearches.length > 0) {
      console.log('📦 No search matches - using popular products for "Based on Searches" section');
      
      const { data: popularProducts } = await supabase
        .from('products')
        .select('*')
        .not('view_count', 'is', null)
        .order('view_count', { ascending: false })
        .limit(6);

      if (popularProducts && popularProducts.length > 0) {
        cacheHits += popularProducts.length;
        popularProducts.forEach(product => {
          allProducts.push({
            product: formatProduct(product),
            score: 22,
            matchReason: ['Curated for you'],
            section: 'search'
          });
        });
      }
    }

    // ===== STRATEGY 2: Similar to Recently Viewed =====
    if (recentlyViewedIds.length > 0) {
      console.log('👀 Finding similar products to viewed:', recentlyViewedIds.slice(0, 5));
      
      // First get the viewed products to extract categories/brands
      const { data: viewedProducts, error: viewedError } = await supabase
        .from('products')
        .select('product_id, category, brand, title')
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
            .not('product_id', 'in', `(${recentlyViewedIds.map(id => `'${id}'`).join(',')})`)
            .order('view_count', { ascending: false, nullsFirst: false })
            .limit(4);

          if (!error && similarProducts && similarProducts.length > 0) {
            cacheHits += similarProducts.length;
            viewedBasedFound += similarProducts.length;
            similarProducts.forEach(product => {
              allProducts.push({
                product: formatProduct(product),
                score: 20,
                matchReason: [`More in ${category}`],
                section: 'viewed'
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
            .not('product_id', 'in', `(${recentlyViewedIds.map(id => `'${id}'`).join(',')})`)
            .order('view_count', { ascending: false, nullsFirst: false })
            .limit(3);

          if (!error && brandProducts && brandProducts.length > 0) {
            cacheHits += brandProducts.length;
            viewedBasedFound += brandProducts.length;
            brandProducts.forEach(product => {
              allProducts.push({
                product: formatProduct(product),
                score: 18,
                matchReason: [`More from ${brand}`],
                section: 'viewed'
              });
            });
          }
        }
      } else {
        console.log('⚠️ Viewed products not found in cache');
      }
    }

    // ===== FALLBACK for Viewed-Based: Use diverse category products =====
    if (viewedBasedFound === 0 && recentlyViewedIds.length > 0) {
      console.log('📦 No viewed matches - using diverse products for "Similar to Viewed" section');
      
      // Get products from different categories
      const { data: diverseProducts } = await supabase
        .from('products')
        .select('*')
        .not('category', 'is', null)
        .order('view_count', { ascending: false })
        .limit(6);

      if (diverseProducts && diverseProducts.length > 0) {
        cacheHits += diverseProducts.length;
        diverseProducts.forEach(product => {
          allProducts.push({
            product: formatProduct(product),
            score: 18,
            matchReason: ['You might also like'],
            section: 'viewed'
          });
        });
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
          .order('view_count', { ascending: false, nullsFirst: false })
          .limit(4);

        if (!error && tagProducts && tagProducts.length > 0) {
          cacheHits += tagProducts.length;
          tagProducts.forEach(product => {
            allProducts.push({
              product: formatProduct(product),
              score: 15,
              matchReason: [`Matches "${tag}"`],
              section: 'tag'
            });
          });
        }
      }
    }

    // ===== STRATEGY 4: Global Trending (Fallback) =====
    console.log('📈 Fetching trending products');
    
    // Get trending search terms
    const { data: trendingSearches } = await supabase
      .from('search_trends')
      .select('search_query, search_count')
      .gt('search_count', 3)
      .order('search_count', { ascending: false })
      .limit(5);

    if (trendingSearches && trendingSearches.length > 0) {
      for (const trend of trendingSearches.slice(0, 3)) {
        const { data: trendingProducts } = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${trend.search_query}%`)
          .order('view_count', { ascending: false, nullsFirst: false })
          .limit(4);

        if (trendingProducts && trendingProducts.length > 0) {
          cacheHits += trendingProducts.length;
          trendingProducts.forEach(product => {
            allProducts.push({
              product: formatProduct(product),
              score: 10,
              matchReason: [`Trending: ${trend.search_query}`],
              section: 'trending'
            });
          });
        }
      }
    }

    // Also get popular products by view count
    const { data: popularProducts } = await supabase
      .from('products')
      .select('*')
      .gt('view_count', 0)
      .order('view_count', { ascending: false })
      .limit(8);

    if (popularProducts && popularProducts.length > 0) {
      cacheHits += popularProducts.length;
      popularProducts.forEach(product => {
        allProducts.push({
          product: formatProduct(product),
          score: 8,
          matchReason: ['Popular gift'],
          section: 'trending'
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
        // Keep the higher priority section
        const sectionPriority = { search: 4, viewed: 3, tag: 2, trending: 1 };
        if (sectionPriority[scored.section] > sectionPriority[existing.section]) {
          existing.section = scored.section;
        }
        existing.score += scored.score;
        existing.matchReason = [...new Set([...existing.matchReason, ...scored.matchReason])];
      } else {
        productMap.set(productId, scored);
      }
    }

    // Apply additional scoring factors
    const scoredProducts = Array.from(productMap.values()).map(sp => {
      let bonusScore = 0;
      
      const stars = sp.product.stars || sp.product.metadata?.stars || 0;
      if (stars >= 4.5) bonusScore += 5;
      else if (stars >= 4.0) bonusScore += 3;
      
      const reviewCount = sp.product.review_count || sp.product.metadata?.review_count || 0;
      if (reviewCount > 1000) bonusScore += 4;
      else if (reviewCount > 100) bonusScore += 2;
      
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
        .filter(sp => sp.section === 'search')
        .slice(0, 6)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] })),
      
      viewedBased: rankedProducts
        .filter(sp => sp.section === 'viewed')
        .slice(0, 6)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] })),
      
      tagBased: rankedProducts
        .filter(sp => sp.section === 'tag')
        .slice(0, 4)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] })),
      
      trending: rankedProducts
        .filter(sp => sp.section === 'trending')
        .slice(0, 6)
        .map(sp => ({ ...sp.product, matchReason: sp.matchReason[0] }))
    };

    // Mixed list
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
