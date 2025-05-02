
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fetchApiKey = async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') 
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables for Supabase connection');
      throw new Error('Missing environment variables for Supabase connection');
    }
    
    console.log(`Connecting to Supabase at: ${supabaseUrl.substring(0, 20)}...`);
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
    
    // Mask the key for security in logs
    const maskedKey = data.key ? `${data.key.substring(0, 4)}...${data.key.substring(data.key.length - 4)}` : null;
    console.log(`API key found: ${maskedKey ? 'yes' : 'no'}, value: ${maskedKey || 'none'}`);
    return data.key;
  } catch (err) {
    console.error('Error in fetchApiKey:', err);
    return null;
  }
};

serve(async (req) => {
  const {method} = req;
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (method === 'POST') {
    try {
      console.log('Fetching API key from database...');
      const api_key = await fetchApiKey();
      console.log('API key found:', api_key ? 'yes' : 'no');
      
      if(!api_key) {
        console.error('API key not found in database, returning mock results');
        return new Response(JSON.stringify({
          success: false, 
          message: 'API key not found', 
          results: generateMockResults(10)
        }), { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      const requestData = await req.json();
      const {search_term, retailer = "amazon", results_limit = "20"} = requestData;
      
      try {
        console.log(`Searching for "${search_term}" on ${retailer}, limit: ${results_limit}`);
        
        // Make the actual API call to Zinc
        const zincApiUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(search_term)}&page=1&retailer=${retailer}&max_results=${results_limit}`;
        console.log(`Calling Zinc API at: ${zincApiUrl}`);
        
        // Set timeout for the fetch request to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(zincApiUrl, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + btoa(`${api_key}:`)
            },
            signal: controller.signal
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
      
          // Log detailed info about the response for debugging
          console.log(`Zinc API response status: ${response.status}`);
          
          if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error response from Zinc API:', errorText);
            
            return new Response(JSON.stringify({
              success: false, 
              error: `API error: ${response.status}`, 
              message: errorText,
              results: generateMockResults(parseInt(results_limit))
            }), { 
              status: 200, 
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          
          const data = await response.json();
          const resultCount = data.results?.length || 0;
          console.log(`Zinc API returned ${resultCount} results`);
          
          if (resultCount === 0) {
            console.log('Zinc API returned 0 results, returning mock data');
            return new Response(JSON.stringify({
              success: false,
              message: 'No results found from Zinc API',
              results: generateMockResults(parseInt(results_limit))
            }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          // Log a sample of the first result for debugging
          if (resultCount > 0) {
            console.log('Sample first result:', JSON.stringify({
              title: data.results[0].title,
              price: data.results[0].price,
              image: data.results[0].main_image ? 'exists' : 'missing'
            }));
          }
      
          return new Response(JSON.stringify({
            success: true,
            message: `Found ${resultCount} results for "${search_term}"`,
            results: data.results
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (fetchError) {
          // Clear the timeout in case of error
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            console.error('Zinc API request timed out after 10 seconds');
            return new Response(JSON.stringify({
              success: false, 
              message: 'Zinc API request timed out', 
              results: generateMockResults(parseInt(results_limit))
            }), { 
              status: 200, 
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          
          throw fetchError; // Re-throw for the outer catch
        }
      } catch(error) {
        console.error('Error calling Zinc API:', error);
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
      console.error('General error:', error);
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
