
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = "35", nicoleContext, minPrice, maxPrice, min_price, max_price } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // **PHASE 2: Unified Budget Handling**
    const budgetMin = minPrice || min_price || (nicoleContext?.budget?.[0]) || undefined;
    const budgetMax = maxPrice || max_price || (nicoleContext?.budget?.[1]) || undefined;

    console.log(`🎯 Zinc API: Enhanced search - Query: "${query}", Budget: $${budgetMin}-$${budgetMax}, Nicole Context:`, nicoleContext);

    // Get Zinc API key from Supabase secrets
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    
    console.log('🔑 Zinc API Key check:', { 
      hasKey: !!zincApiKey, 
      keyLength: zincApiKey?.length || 0,
      keyPrefix: zincApiKey?.substring(0, 8) || 'none'
    });
    
    if (!zincApiKey) {
      console.error('❌ ZINC_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration missing - ZINC_API_KEY not found',
          fallback: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use the correct Zinc API endpoint and method - GET request with query params
    const zincUrl = new URL('https://api.zinc.io/v1/products/search');
    const zincHeaders = {
      'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
      'Content-Type': 'application/json',
    };

    // **PHASE 3: Enhanced Zinc API Request with Budget Constraints**
    // Build query parameters for GET request
    zincUrl.searchParams.set('query', query);
    zincUrl.searchParams.set('retailer', 'amazon');
    zincUrl.searchParams.set('max_results', Math.min(parseInt(maxResults), 100).toString());
    zincUrl.searchParams.set('page', '1');
    zincUrl.searchParams.set('sort', 'relevance');
    zincUrl.searchParams.set('condition', 'new');

    // Add price filters if available
    if (budgetMin !== undefined) {
      zincUrl.searchParams.set('min_price', Math.round(budgetMin * 100).toString()); // Zinc expects cents
    }
    if (budgetMax !== undefined) {
      zincUrl.searchParams.set('max_price', Math.round(budgetMax * 100).toString()); // Zinc expects cents
    }

    console.log('🎯 Zinc API: Request with budget filters:', Object.fromEntries(zincUrl.searchParams));

    console.log('Making Zinc API request:', { url: zincUrl.toString() });

    // Make request to Zinc API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const zincResponse = await fetch(zincUrl.toString(), {
        method: 'GET',
        headers: zincHeaders,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`Zinc API response status: ${zincResponse.status}`);

      if (!zincResponse.ok) {
        const errorText = await zincResponse.text();
        console.error('Zinc API error:', zincResponse.status, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: `Zinc API error: ${zincResponse.status}`,
            details: errorText,
            fallback: true
          }),
          { 
            status: zincResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const zincData = await zincResponse.json();
      console.log(`Zinc API returned ${zincData.results?.length || 0} results`);

      // **PHASE 4: Enhanced Product Transformation with Budget Validation**
      const transformedResults = (zincData.results || []).map((product: any) => {
        const productPrice = parseFloat(product.price || product.price_upper || product.price_lower || 0);
        
        return {
          product_id: product.product_id || product.asin || product.id || `zinc-${Date.now()}-${Math.random()}`,
          title: product.title || product.name || 'Unknown Product',
          price: productPrice,
          description: product.description || product.feature_bullets?.join('. ') || '',
          image: product.image || product.main_image || product.images?.[0] || '/placeholder.svg',
          images: product.images || [product.image || product.main_image] || ['/placeholder.svg'],
          category: product.category || product.product_category || 'Electronics',
          retailer: 'Amazon via Zinc',
          rating: parseFloat(product.rating || product.review_rating || 0),
          review_count: parseInt(product.review_count || product.num_reviews || 0),
          url: product.url || product.product_url || '#',
          brand: product.brand || '',
          availability: product.availability || 'in_stock',
          // Add Nicole context metadata for relevance scoring
          nicoleMatch: nicoleContext ? {
            budgetMatch: (!budgetMin || productPrice >= budgetMin) && (!budgetMax || productPrice <= budgetMax),
            interestMatch: nicoleContext.interests?.some(interest => 
              product.title?.toLowerCase().includes(interest.toLowerCase()) ||
              product.description?.toLowerCase().includes(interest.toLowerCase())
            ) || false
          } : undefined
        };
      });

      // **PHASE 5: Budget-First Filtering**
      const budgetFilteredResults = transformedResults.filter(product => {
        if (budgetMin !== undefined && product.price < budgetMin) return false;
        if (budgetMax !== undefined && product.price > budgetMax) return false;
        return true;
      });

      console.log(`🎯 Zinc API: Budget filtering: ${transformedResults.length} → ${budgetFilteredResults.length} products`);
      
      const finalResults = budgetFilteredResults.length > 0 ? budgetFilteredResults : transformedResults;

      console.log(`🎯 Zinc API: Successfully processed ${finalResults.length} products (${budgetFilteredResults.length} within budget)`);

      return new Response(
        JSON.stringify({ 
          results: finalResults,
          total: finalResults.length,
          query: query,
          source: 'zinc-api',
          nicoleContext: nicoleContext || null,
          budgetApplied: {
            min: budgetMin,
            max: budgetMax,
            filtered: transformedResults.length - budgetFilteredResults.length
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Zinc API request timed out');
        return new Response(
          JSON.stringify({ 
            error: 'Request timed out',
            fallback: true
          }),
          { 
            status: 408, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error('Zinc API fetch error:', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in zinc-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        fallback: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
