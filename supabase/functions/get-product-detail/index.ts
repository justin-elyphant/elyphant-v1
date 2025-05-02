
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
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (method === 'POST') {
    const api_key = await fetchApiKey();
    if(!api_key) {
      return new Response('API key not found', { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const {product_id, retailer} = await req.json();
    try {
      console.log(`Fetching product details for ID: ${product_id}, retailer: ${retailer}`);
      
      const response = await fetch(`https://api.zinc.io/v1/products/${product_id}?retailer=${retailer}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`),
          'Content-Type': 'application/json'
        }
      });

      console.log(`Received response with status: ${response.status}`);
      
      const data = await response.json();
      
      console.log(`Successfully parsed response for product ID: ${product_id}`);
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });      
    } catch(error) {
      console.error('Error in get-product-detail function:', error);
      return new Response(
        JSON.stringify({
          success: false, 
          message: 'Internal server error', 
          error: error.message
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  
  // Handle unsupported methods
  return new Response(
    JSON.stringify({ error: `Method ${method} not allowed` }),
    { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
})
