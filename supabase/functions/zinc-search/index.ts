
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { query, maxResults = "10" } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Zinc API search request: "${query}", max results: ${maxResults}`);

    // Get Zinc API key from Supabase secrets
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    
    if (!zincApiKey) {
      console.error('ZINC_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration missing',
          fallback: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construct Zinc API request
    const zincUrl = `https://api.zinc.io/v1/search`;
    const zincHeaders = {
      'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
      'Content-Type': 'application/json',
    };

    const zincBody = {
      query: query,
      max_results: parseInt(maxResults),
      retailer: 'amazon'
    };

    console.log('Making Zinc API request:', { url: zincUrl, query, maxResults });

    // Make request to Zinc API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const zincResponse = await fetch(zincUrl, {
        method: 'POST',
        headers: zincHeaders,
        body: JSON.stringify(zincBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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

      // Transform Zinc results to our product format
      const transformedResults = (zincData.results || []).map((product: any) => ({
        product_id: product.product_id || product.id,
        title: product.title || 'Unknown Product',
        price: product.price || 0,
        description: product.description || '',
        image: product.image || product.picture_url || '/placeholder.svg',
        images: product.images || [product.image || product.picture_url],
        category: product.category || 'General',
        retailer: 'Amazon via Zinc',
        rating: product.rating || 0,
        review_count: product.review_count || 0,
        url: product.url || '#'
      }));

      return new Response(
        JSON.stringify({ 
          results: transformedResults,
          total: transformedResults.length,
          query: query
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
