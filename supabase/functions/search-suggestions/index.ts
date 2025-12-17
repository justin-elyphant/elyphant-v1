/**
 * Search Suggestions Edge Function
 * Lightweight endpoint for real-time autocomplete suggestions
 * Returns: trending searches + product title matches
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const { query, limit = 8 } = await req.json();
    const supabase = getSupabaseClient();

    if (!supabase) {
      return new Response(
        JSON.stringify({ suggestions: [], trending: [], products: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const normalizedQuery = (query || '').toLowerCase().trim();
    
    // If no query, return trending searches
    if (!normalizedQuery || normalizedQuery.length < 2) {
      const { data: trending } = await supabase
        .from('search_trends')
        .select('search_query, search_count')
        .order('search_count', { ascending: false })
        .limit(5);

      return new Response(
        JSON.stringify({
          suggestions: [],
          trending: (trending || []).map((t: any) => ({
            text: t.search_query,
            type: 'trending',
            count: t.search_count
          })),
          products: []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parallel queries for suggestions
    const [trendingResult, productsResult] = await Promise.all([
      // 1. Search trends matching query
      supabase
        .from('search_trends')
        .select('search_query, search_count')
        .ilike('search_query', `%${normalizedQuery}%`)
        .order('search_count', { ascending: false })
        .limit(3),
      
      // 2. Products with matching titles
      supabase
        .from('products')
        .select('product_id, title, price, image_url, brand, metadata')
        .or(`title.ilike.%${normalizedQuery}%,brand.ilike.%${normalizedQuery}%`)
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(5)
    ]);

    const trending = (trendingResult.data || []).map((t: any) => ({
      text: t.search_query,
      type: 'trending',
      count: t.search_count
    }));

    const products = (productsResult.data || []).map((p: any) => ({
      id: p.product_id,
      title: p.title,
      price: p.price,
      image: p.image_url || p.metadata?.main_image,
      brand: p.brand,
      type: 'product'
    }));

    // Generate text suggestions from product titles
    const titleWords = new Set<string>();
    (productsResult.data || []).forEach((p: any) => {
      const words = (p.title || '').toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 3 && word.includes(normalizedQuery)) {
          titleWords.add(word);
        }
      });
    });

    // Combine into suggestions array
    const suggestions = [
      ...trending.slice(0, 3),
      ...Array.from(titleWords).slice(0, 3).map(word => ({
        text: word,
        type: 'suggestion'
      }))
    ].slice(0, limit);

    console.log(`[search-suggestions] Query: "${normalizedQuery}" → ${suggestions.length} suggestions, ${products.length} products`);

    return new Response(
      JSON.stringify({
        suggestions,
        trending: trending.slice(0, 3),
        products: products.slice(0, 5)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('[search-suggestions] Error:', error);
    return new Response(
      JSON.stringify({ 
        suggestions: [], 
        trending: [], 
        products: [],
        error: 'Failed to fetch suggestions' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
