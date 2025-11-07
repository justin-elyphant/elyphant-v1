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

    const { recipientEmail } = await req.json();

    console.log(`🗑️ Deleting pending invitations for: ${recipientEmail}`);

    const { data, error } = await supabaseClient
      .from('user_connections')
      .delete()
      .eq('pending_recipient_email', recipientEmail)
      .eq('status', 'pending_invitation')
      .select();

    if (error) throw error;

    console.log(`✅ Deleted ${data?.length || 0} pending invitations`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: data?.length || 0,
        invitations: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error deleting pending invitations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
