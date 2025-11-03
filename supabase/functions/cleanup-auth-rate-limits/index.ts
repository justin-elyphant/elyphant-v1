import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Starting auth rate limits cleanup...');

    // Call the cleanup function
    const { error: cleanupError } = await supabaseClient
      .rpc('cleanup_auth_rate_limits');

    if (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
      throw cleanupError;
    }

    // Get remaining rate limits count
    const { count, error: countError } = await supabaseClient
      .from('auth_rate_limits')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('⚠️ Count query failed:', countError);
    }

    console.log(`✅ Cleanup completed. Active rate limits: ${count || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auth rate limits cleanup completed',
        active_rate_limits: count || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in cleanup function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
