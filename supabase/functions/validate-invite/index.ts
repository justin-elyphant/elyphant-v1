import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();
    
    if (!token) {
      console.error('[validate-invite] Missing token in request');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[validate-invite] Validating token:', token);

    // First, try to find a connection invitation
    const { data: connectionData, error: connectionError } = await supabase
      .from('user_connections')
      .select('id, pending_recipient_email, pending_recipient_name, user_id')
      .eq('invitation_token', token)
      .eq('status', 'pending_invitation')
      .maybeSingle();

    if (connectionError) {
      console.error('[validate-invite] Error querying user_connections:', connectionError);
    }

    if (connectionData) {
      console.log('[validate-invite] Found connection invitation:', connectionData.id);
      
      // Fetch sender name from profiles (optional, best-effort)
      let senderName = 'Your friend';
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, name')
        .eq('id', connectionData.user_id)
        .single();
      
      if (senderProfile) {
        senderName = senderProfile.first_name || senderProfile.name || 'Your friend';
        console.log('[validate-invite] Found sender name:', senderName);
      }

      return new Response(
        JSON.stringify({
          type: 'connection',
          connectionId: connectionData.id,
          recipientEmail: connectionData.pending_recipient_email,
          recipientName: connectionData.pending_recipient_name,
          senderName
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not a connection invitation, try gift invitation
    const { data: giftInvitationData, error: giftError } = await supabase
      .from('pending_gift_invitations')
      .select('invitation_token, recipient_email, recipient_name')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (giftError) {
      console.error('[validate-invite] Error querying pending_gift_invitations:', giftError);
    }

    if (giftInvitationData) {
      console.log('[validate-invite] Found gift invitation');
      
      return new Response(
        JSON.stringify({
          type: 'gift',
          connectionId: token,
          recipientEmail: giftInvitationData.recipient_email,
          recipientName: giftInvitationData.recipient_name,
          senderName: 'Someone'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No matching invitation found
    console.log('[validate-invite] No matching invitation found for token');
    return new Response(
      JSON.stringify({ error: 'Invalid or expired invitation token' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-invite] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
