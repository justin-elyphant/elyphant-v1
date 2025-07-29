import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 ZMA Function - Debug Version Started');
  
  try {
    // Step 1: Parse request
    console.log('📥 Step 1: Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('✅ Request body parsed:', JSON.stringify(body));
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      throw new Error(`Invalid JSON: ${parseError.message}`);
    }

    const { orderId, cardholderName } = body;
    
    if (!orderId) {
      console.log('❌ No order ID provided');
      throw new Error('Order ID is required');
    }

    console.log(`🔍 Processing order: ${orderId}, cardholder: ${cardholderName}`);

    // Step 2: Create Supabase client
    console.log('📥 Step 2: Creating Supabase client...');
    let supabase;
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      console.log('✅ Supabase client created');
    } catch (supabaseError) {
      console.error('❌ Supabase client creation failed:', supabaseError);
      throw new Error(`Supabase setup failed: ${supabaseError.message}`);
    }

    // Step 3: Check if order exists (simple check first)
    console.log('📥 Step 3: Checking if order exists...');
    try {
      const { data: orderCheck, error: checkError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('id', orderId)
        .single();

      if (checkError) {
        console.error('❌ Order check error:', checkError);
        throw new Error(`Order lookup failed: ${checkError.message}`);
      }
      
      if (!orderCheck) {
        console.error('❌ Order not found');
        throw new Error('Order not found');
      }

      console.log(`✅ Order exists: ${orderCheck.order_number}`);
    } catch (orderError) {
      console.error('❌ Order verification failed:', orderError);
      throw new Error(`Order verification failed: ${orderError.message}`);
    }

    // For now, just return success with the debug info
    console.log('✅ All basic checks passed - returning success');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ZMA Debug: All basic checks passed!',
      orderId: orderId,
      cardholderName: cardholderName,
      debug: {
        step1_parseRequest: '✅ Success',
        step2_supabaseClient: '✅ Success', 
        step3_orderExists: '✅ Success'
      },
      nextSteps: 'Ready to add ZMA processing logic',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('🚨 ZMA Debug Error:', error);
    console.error('🚨 Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      debug: 'Check the edge function logs for detailed debugging info'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});