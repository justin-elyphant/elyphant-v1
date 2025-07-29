import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 ZMA Function started - basic version');
  
  try {
    const body = await req.json();
    console.log('📥 Request body received:', body);
    
    const { orderId, cardholderName } = body;
    
    if (!orderId) {
      console.log('❌ No order ID provided');
      throw new Error('Order ID is required');
    }

    console.log(`🔍 Processing order: ${orderId}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('✅ Supabase client created');

    // Test basic order fetch
    console.log('📋 Fetching order...');
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('📋 Order fetch result:', { hasOrder: !!order, error: orderError });

    if (orderError || !order) {
      console.error(`❌ Order not found: ${orderError?.message}`);
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log(`✅ Order found: ${order.order_number}`);

    // Test ZMA account fetch
    console.log('🔐 Fetching ZMA accounts...');
    const { data: zmaAccounts, error: zmaError } = await supabaseClient
      .from('zma_accounts')
      .select('*');

    console.log('🔐 ZMA accounts result:', { 
      accountCount: zmaAccounts?.length, 
      error: zmaError,
      accounts: zmaAccounts?.map(a => ({ name: a.account_name, isDefault: a.is_default }))
    });

    if (zmaError) {
      console.error("❌ ZMA query error:", zmaError);
      throw new Error(`ZMA account query failed: ${zmaError.message}`);
    }

    // For now, just return success with debugging info
    console.log('✅ Basic validation complete');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ZMA function basic test successful',
      orderId: orderId,
      orderNumber: order.order_number,
      cardholderName: cardholderName,
      zmaAccountsFound: zmaAccounts?.length || 0,
      debug: {
        hasOrder: !!order,
        hasZmaAccounts: (zmaAccounts?.length || 0) > 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('🚨 Error in ZMA function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});