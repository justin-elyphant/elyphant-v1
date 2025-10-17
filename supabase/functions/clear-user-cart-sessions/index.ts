import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

    const { userId } = await req.json();

    console.log(`🗑️ Deleting ALL cart data (cart_sessions + user_carts) for user: ${userId}`);

    // Delete all cart_sessions for this user
    const { data: deletedSessions, error: sessionError } = await supabaseClient
      .from('cart_sessions')
      .delete()
      .eq('user_id', userId)
      .select();

    if (sessionError) {
      throw sessionError;
    }

    // Delete all user_carts for this user
    const { data: deletedCarts, error: cartError } = await supabaseClient
      .from('user_carts')
      .delete()
      .eq('user_id', userId)
      .select();

    if (cartError) {
      throw cartError;
    }

    console.log(`✅ Deleted ${deletedSessions?.length || 0} cart_sessions and ${deletedCarts?.length || 0} user_carts`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionsDeleted: deletedSessions?.length || 0,
        cartsDeleted: deletedCarts?.length || 0,
        message: `Cleared ${deletedSessions?.length || 0} cart_sessions and ${deletedCarts?.length || 0} user_carts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error clearing cart sessions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
