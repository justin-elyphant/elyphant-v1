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
    const { api_key } = await req.json();
    console.log('api_key', api_key);
    try {
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent('Nike Shoes')}&page=1&retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
  
      const data = await response.json();
      if (data) {
        return new Response(JSON.stringify({success: true}), 
          { 
            status: 200,
            headers: corsHeaders 
          }
        );
      }
    } catch(e) {
      console.log('error', e);
      return new Response(JSON.stringify({error: true, success: false}),
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
})