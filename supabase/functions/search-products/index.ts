
import { serve } from "std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const api_key = await fetchApiKey();
    if(!api_key) {
      return new Response(JSON.stringify({ error: 'API key not found' }), { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { search_term, results_limit = "20", retailer = "amazon" } = await req.json();
    
    console.log(`Processing search request for term: ${search_term}, limit: ${results_limit}, retailer: ${retailer}`);

    // Request to Zinc API
    const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(search_term)}&page=1&retailer=${retailer}&max_results=${results_limit}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${api_key}:`),
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Received response from Zinc API with status: ${response.status}`);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error in search-products function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
