import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 Checking Zinc order status...');

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { zincOrderId } = body;

    if (!zincOrderId) {
      throw new Error('Zinc order ID is required');
    }

    console.log(`🔍 Checking status for Zinc order: ${zincOrderId}`);

    // Get ZMA credentials
    const { data: zmaAccount, error: credError } = await supabase
      .from('zma_accounts')
      .select('*')
      .eq('is_default', true)
      .eq('account_status', 'active')
      .limit(1)
      .single();

    if (credError || !zmaAccount) {
      throw new Error('No active default ZMA account found');
    }

    // Check status with Zinc API
    const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${zincOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
      }
    });

    const zincResult = await zincResponse.json();
    console.log('📤 Zinc status response:', JSON.stringify(zincResult));

    if (!zincResponse.ok) {
      throw new Error(`Zinc API error: ${zincResult.message || 'Unknown error'}`);
    }

    // Update our database with the current Zinc status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        zinc_status: zincResult.status || 'unknown',
        updated_at: new Date().toISOString()
      })
      .eq('zinc_order_id', zincOrderId);

    if (updateError) {
      console.error('Failed to update order status:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      zincOrderId,
      zincStatus: zincResult.status,
      zincData: zincResult,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Error checking Zinc status:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});