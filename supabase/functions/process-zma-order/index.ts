import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  console.log(`📥 Received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  console.log('🚀 ZMA Function started');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { orderId } = requestBody;
    
    console.log(`🔍 Processing order: ${orderId}`);

    // Fetch order from database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log(`📋 Order found: ${orderData.order_number}`);

    // For now, just return success to test connectivity
    return new Response(
      JSON.stringify({
        success: true,
        message: 'ZMA function is working! Order retry connectivity test successful.',
        orderId: orderId,
        orderNumber: orderData.order_number,
        status: orderData.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ ZMA function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'ZMA function test failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});