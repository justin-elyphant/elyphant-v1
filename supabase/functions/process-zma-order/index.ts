import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 ZMA Function - ULTRA SIMPLE VERSION');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Processing request...');
    
    const body = await req.json();
    console.log('📋 Body received:', JSON.stringify(body));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Ultra simple ZMA test successful!',
      received: body,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Ultra simple error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});