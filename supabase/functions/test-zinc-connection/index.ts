import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const zincApiKey = Deno.env.get('ZINC_API_KEY')
    
    if (!zincApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ZINC_API_KEY not configured' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test the Zinc API with a simple account status check
    const testResponse = await fetch('https://api.zinc.io/v1/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(zincApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    })

    const testResult = await testResponse.json()
    
    return new Response(
      JSON.stringify({
        success: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText,
        zincResponse: testResult,
        apiKeyLength: zincApiKey.length,
        message: testResponse.ok ? 'Zinc API connection successful' : 'Zinc API connection failed'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})