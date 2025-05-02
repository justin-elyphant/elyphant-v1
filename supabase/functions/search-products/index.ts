
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fetchApiKey = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') 
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing environment variables for Supabase connection')
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
  .from('api_keys')
  .select('key')
  .limit(1)
  .single();
  
  if(error) {
    console.error('Error fetching API key: ', error);
    return null;
  }
  return data.key;
}

serve(async (req) => {
  const {method} = req;
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (method === 'POST') {
    try {
      const api_key = await fetchApiKey();
      console.log('api_key found:', api_key ? 'yes' : 'no');
      
      if(!api_key) {
        return new Response(JSON.stringify({
          success: false, 
          message: 'API key not found', 
          results: generateMockResults(10)
        }), { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      const {search_term, retailer = "amazon", results_limit = "20"} = await req.json();
      
      try {
        console.log(`Searching for ${search_term} on ${retailer}, limit: ${results_limit}`);
        
        // Make the actual API call to Zinc
        const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(search_term)}&page=1&retailer=${retailer}&max_results=${results_limit}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${api_key}:`)
          }
        });
    
        // Log detailed info about the response for debugging
        console.log(`Zinc API response status: ${response.status}`);
        
        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          return new Response(JSON.stringify({
            success: false, 
            error: `API error: ${response.status}`, 
            results: generateMockResults(parseInt(results_limit))
          }), { 
            status: 200, 
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        
        const data = await response.json();
        console.log(`Zinc API returned ${data.results?.length || 0} results`);
    
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch(error) {
        console.log('Error calling Zinc API:', error);
        return new Response(
          JSON.stringify({
            success: false, 
            message: 'Error calling Zinc API: ' + error.message,
            results: generateMockResults(parseInt(results_limit))
          }), 
          { 
            status: 200, 
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
      }
    } catch(error) {
      console.log('General error:', error);
      return new Response(
        JSON.stringify({
          success: false, 
          message: 'Internal server error: ' + error.message,
          results: generateMockResults(10)
        }), 
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
  }
  
  // Return method not allowed for other HTTP methods
  return new Response(JSON.stringify({success: false, message: 'Method not allowed'}), { 
    status: 405, 
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
});

// Generate mock results for fallback
function generateMockResults(count: number) {
  const categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports'];
  const brands = ['Brand X', 'TechPro', 'HomeStyle', 'ActiveGear', 'FashionPlus'];
  
  return Array.from({ length: count }, (_, i) => ({
    product_id: `mock-${i+1}`,
    title: `Mock Product ${i+1}`,
    price: Math.floor(Math.random() * 100) + 9.99,
    main_image: `https://source.unsplash.com/random/300x300?product&sig=${i}`,
    images: [`https://source.unsplash.com/random/300x300?product&sig=${i}`],
    rating: (Math.random() * 2) + 3,
    num_reviews: Math.floor(Math.random() * 1000),
    category: categories[Math.floor(Math.random() * categories.length)],
    description: "This is a mock product description for fallback when the API is unavailable.",
    brand: brands[Math.floor(Math.random() * brands.length)]
  }));
}
