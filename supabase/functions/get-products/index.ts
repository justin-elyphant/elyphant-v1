import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (method === 'POST') {
    const zinc_api = Deno.env.get('ZINC_API_KEY');
    const {query, retailer = "amazon", page = 1} = await req.json();
    try {
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=${retailer}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${zinc_api}:`)
        }
      });
  
      const data = await response.json();
  
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch(error) {
      console.log('Error', error)  
    }
  }
})
