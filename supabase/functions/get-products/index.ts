
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fetchApiKey = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing environment variables for Supabase connection');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('key')
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching API key: ', error);
    return null;
  }
  
  return data.key;
}

serve(async (req) => {
  const { method } = req;
  
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (method === 'POST') {
    try {
      const { query, page = 1 } = await req.json();
      
      // Try to get API key
      const api_key = await fetchApiKey();
      
      if (!api_key) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'API key not found',
            // Include some mock results so the UI doesn't break
            results: generateMockResults(query)
          }), 
          { 
            status: 200, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Make real API call to Zinc
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zinc API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Return mock data as fallback
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error processing request: ' + error.message,
          results: generateMockResults(req.json().query || 'gift')
        }), 
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
  }
  
  return new Response(
    JSON.stringify({ success: false, message: 'Method not allowed' }),
    { 
      status: 405, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    }
  );
});

// Generate mock results for fallback
function generateMockResults(query = '') {
  const normalizedQuery = query.toLowerCase();
  const categories = ['Electronics', 'Home & Kitchen', 'Clothing', 'Books', 'Toys'];
  
  return Array(12).fill(null).map((_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = Math.floor(Math.random() * 10000) / 100;
    const stars = (Math.random() * 3 + 2).toFixed(1);
    
    return {
      product_id: `mock-${normalizedQuery.replace(/\s+/g, '-')}-${i}`,
      title: `${category} Item - ${normalizedQuery} (${i + 1})`,
      price: price * 100, // Convert to cents for consistency
      image: `https://picsum.photos/seed/${normalizedQuery}${i}/300/300`,
      images: [`https://picsum.photos/seed/${normalizedQuery}${i}/300/300`],
      brand: 'Brand Name',
      stars: parseFloat(stars),
      num_reviews: Math.floor(Math.random() * 1000),
      category: category
    };
  });
}
