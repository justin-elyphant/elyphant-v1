
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client for cache operations
const initSupabase = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Process best seller indicators from detailed product response
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

  // Check for Best Seller indicators
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

  // Check sales rank for popular items
  if (product.sales_rank && product.sales_rank <= 50) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'top_rated';
    badgeText = badgeText || 'Top Rated';
  }

  // Check for high review count + rating combination
  if (product.num_reviews && product.num_reviews > 500 && 
      product.rating && product.rating >= 4.5) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'highly_rated';
    badgeText = badgeText || 'Highly Rated';
  }

  // Check for badge text in product details
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

serve(async (req) => {
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (method === 'POST') {
    // Get Zinc API key from secrets
    const api_key = Deno.env.get('ZINC_API_KEY');
    if (!api_key) {
      console.error('ZINC_API_KEY secret not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'API key not configured' }), 
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }}
      );
    }
    
    const { product_id, retailer = 'amazon' } = await req.json();
    const supabase = initSupabase();
    
    try {
      // PHASE 2: Cache-First Architecture (Nicole AI Core)
      // Check products table FIRST before calling Zinc API
      const { data: cachedProduct, error: cacheError } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', product_id)
        .single();
      
      const now = new Date();
      const CACHE_FRESHNESS_DAYS = 7;
      
      // Return cached data if fresh (within 7 days)
      if (cachedProduct && !cacheError) {
        const lastRefreshed = cachedProduct.last_refreshed_at 
          ? new Date(cachedProduct.last_refreshed_at) 
          : null;
        
        const daysSinceRefresh = lastRefreshed 
          ? (now.getTime() - lastRefreshed.getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        
        // Check if cached data has COMPLETE product details (not just search result stub)
        // Zinc API may return product_details OR product_description OR feature_bullets
        const hasCompleteData = Boolean(
          cachedProduct.metadata?.product_description || 
          (cachedProduct.metadata?.feature_bullets && cachedProduct.metadata.feature_bullets.length > 0) ||
          (cachedProduct.metadata?.product_details && cachedProduct.metadata.product_details.length > 0) ||
          (cachedProduct.metadata?.images && cachedProduct.metadata.images.length > 0)
        );
        
        if (daysSinceRefresh < CACHE_FRESHNESS_DAYS && hasCompleteData) {
          console.log(`[Cache HIT] Product ${product_id} - ${daysSinceRefresh.toFixed(1)} days old, complete data`);
          
          // Background update view count and updated_at (non-blocking)
          EdgeRuntime.waitUntil(
            supabase
              .from('products')
              .update({ 
                view_count: (cachedProduct.view_count || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('product_id', product_id)
              .then(({ error }) => {
                if (error) console.error('[Cache HIT] View count update failed:', error);
                else console.log(`[Cache HIT] View count incremented to ${(cachedProduct.view_count || 0) + 1}`);
              })
          );
          
          // Return cached data with metadata fields extracted
          const enhancedData = {
            ...cachedProduct,
            ...(cachedProduct.metadata || {}),
            // Backward compatibility - use image_url from DB, main_image from metadata
            image: cachedProduct.metadata?.main_image || cachedProduct.image_url,
            // Extract ratings from metadata for client
            stars: cachedProduct.metadata?.stars,
            review_count: cachedProduct.metadata?.review_count,
            hasVariations: Boolean(cachedProduct.metadata?.all_variants?.length > 0)
          };
          
          return new Response(JSON.stringify(enhancedData), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } else if (!hasCompleteData) {
          console.log(`[Cache INCOMPLETE] Product ${product_id} - Missing product details, fetching from Zinc API...`);
        } else {
          console.log(`[Cache STALE] Product ${product_id} - ${daysSinceRefresh.toFixed(1)} days old, refreshing...`);
        }
      } else {
        console.log(`[Cache MISS] Product ${product_id} - fetching from Zinc API`);
      }
      
      const authHeader = 'Basic ' + btoa(`${api_key}:`);
      
      // PARALLEL API CALLS: Fetch Product Details AND Offers simultaneously
      const startTime = Date.now();
      
      const [productResponse, offersResponse] = await Promise.all([
        fetch(`https://api.zinc.io/v1/products/${product_id}?retailer=${retailer}`, {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        }),
        fetch(`https://api.zinc.io/v1/products/${product_id}/offers?retailer=${retailer}`, {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        }).catch(() => null) // Non-fatal if offers fail
      ]);
      
      console.log(`[Zinc API] Parallel fetch completed in ${Date.now() - startTime}ms`);

      const data = await productResponse.json();
      
      console.log('Raw Zinc API response for product detail:', JSON.stringify(data, null, 2));
      
      // Process offers response for accurate current pricing
      let currentPrice = data.price;
      if (offersResponse && offersResponse.ok) {
        try {
          const offersData = await offersResponse.json();
          console.log('Offers API response:', JSON.stringify(offersData, null, 2));
          
          // Find best offer (prioritize NEW condition, then first-party seller, then any available)
          const bestOffer = offersData.offers?.find((offer: any) => 
            offer.available && 
            offer.seller?.first_party && 
            (!offer.condition || offer.condition === 'New')
          ) || offersData.offers?.find((offer: any) => 
            offer.available && 
            (!offer.condition || offer.condition === 'New')
          ) || offersData.offers?.[0];
          
          if (bestOffer?.price) {
            currentPrice = bestOffer.price;
            console.log(`[Offers API] Updated price from ${data.price} to ${currentPrice}`);
          }
        } catch (offersError) {
          console.log('Offers API parse error (non-fatal):', offersError);
        }
      }
      
      // Process best seller data for the product detail
      const bestSellerData = processBestSellerData(data);
      
      // Extract and format description from multiple possible fields
      const extractDescription = (product: any) => {
        // Try multiple fields for description
        if (product.product_description && typeof product.product_description === 'string') {
          return product.product_description;
        }
        if (product.feature_bullets && Array.isArray(product.feature_bullets)) {
          return product.feature_bullets.join(' • ');
        }
        if (product.description && typeof product.description === 'string') {
          return product.description;
        }
        return '';
      };
      
      // Enhanced data with full API response structure + backward compatibility
      const enhancedData = {
        ...data,
        ...bestSellerData,
        // Backward compatibility mappings
        image: data.main_image || data.image,
        description: extractDescription(data),
        rating: data.stars || data.rating,
        price: currentPrice, // Use offers API price if available
        // Proper variation handling - ensure arrays are preserved
        all_variants: Array.isArray(data.all_variants) ? data.all_variants : [],
        variant_specifics: Array.isArray(data.variant_specifics) ? data.variant_specifics : [],
        // Variation detection flag for gradual rollout
        hasVariations: Boolean(data.all_variants && Array.isArray(data.all_variants) && data.all_variants.length > 0),
        // PRESERVE cached review data for frontend response
        // Zinc confirmed: Search API returns reviews, Detail API often returns null
        // Use explicit null check (not ??) since Zinc returns null, not undefined
        stars: (data.stars !== null && data.stars !== undefined) ? data.stars : (cachedProduct?.metadata?.stars || null),
        review_count: data.review_count || data.num_reviews || cachedProduct?.metadata?.review_count || null,
        num_reviews: data.review_count || data.num_reviews || cachedProduct?.metadata?.review_count || null,
        // Legacy retailer field
        retailer: retailer || data.retailer
      };
      
      console.log('Enhanced product data with variations:', {
        title: enhancedData.title,
        hasVariations: enhancedData.hasVariations,
        variantCount: enhancedData.all_variants?.length || 0,
        description: enhancedData.description ? enhancedData.description.substring(0, 100) + '...' : 'No description'
      });
      
      // PHASE 2: Store COMPLETE Zinc response in products table
      // Use correct column names that match schema (image_url, not image)
      // Store stars/review_count in metadata JSONB, not as top-level columns
      const productPayload = {
        product_id: product_id,
        title: enhancedData.title,
        price: currentPrice,
        image_url: enhancedData.main_image || enhancedData.image || null,
        retailer: retailer,
        brand: enhancedData.brand || null,
        category: enhancedData.categories?.[0] || null,
        last_refreshed_at: now.toISOString(),
        freshness_score: 1.0,
        view_count: (cachedProduct?.view_count || 0) + 1,
        metadata: {
          // Store ALL rating/review data in metadata JSONB
          // PRESERVE cached review data if Zinc API returns null (search results may have had reviews)
          // Use explicit null check since Zinc returns null, not undefined
          stars: (enhancedData.stars !== null && enhancedData.stars !== undefined) ? enhancedData.stars : (cachedProduct?.metadata?.stars || null),
          review_count: enhancedData.review_count || enhancedData.num_reviews || cachedProduct?.metadata?.review_count || null,
          // Store complete image arrays
          main_image: enhancedData.main_image,
          images: enhancedData.images,
          // Store all variant data
          all_variants: enhancedData.all_variants,
          variant_specifics: enhancedData.variant_specifics,
          // Store descriptions
          product_description: enhancedData.product_description,
          feature_bullets: enhancedData.feature_bullets,
          // Store other Zinc fields
          package_dimensions: enhancedData.package_dimensions,
          epids: enhancedData.epids,
          categories: enhancedData.categories,
          authors: enhancedData.authors,
          original_retail_price: enhancedData.original_retail_price,
          current_price: currentPrice,
          question_count: enhancedData.question_count,
          asin: enhancedData.asin,
          handmade: enhancedData.handmade,
          digital: enhancedData.digital,
          num_offers: enhancedData.num_offers,
          num_sales: enhancedData.num_sales,
          // Preserve all other fields from Zinc API
          ...Object.keys(data).reduce((acc, key) => {
            if (!['product_id', 'title', 'price', 'retailer'].includes(key)) {
              acc[key] = data[key];
            }
            return acc;
          }, {} as any)
        }
      };
      
      // Return response immediately, then cache in background
      const response = new Response(JSON.stringify(enhancedData), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
      
      // BACKGROUND DB WRITE: Use waitUntil to not block response
      EdgeRuntime.waitUntil(
        (async () => {
          const { error: upsertError } = await supabase
            .from('products')
            .upsert(productPayload, { onConflict: 'product_id' });
          
          if (upsertError) {
            console.error('Error upserting product to cache:', upsertError);
          } else {
            console.log(`[Cache UPDATED] Product ${product_id} stored with complete metadata`);
          }
        })()
      );

      return response;
    } catch(error) {
      console.log('Error', error);
      return new Response(
        JSON.stringify({success: false, message: 'Internal server error.'}), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
  }
})
