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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete user data from all tables (in order of foreign key dependencies)
    // Note: cart_sessions table was removed in cart architecture cleanup

    // Delete order-related data
    await supabaseAdmin.from('order_items').delete().eq('order_id', userId);
    await supabaseAdmin.from('orders').delete().eq('user_id', userId);

    // Delete auto-gifting data
    await supabaseAdmin.from('automated_gift_executions').delete().eq('user_id', userId);
    await supabaseAdmin.from('auto_gifting_rules').delete().eq('user_id', userId);
    await supabaseAdmin.from('auto_gifting_settings').delete().eq('user_id', userId);
    await supabaseAdmin.from('auto_gift_notifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('auto_gift_event_logs').delete().eq('user_id', userId);
    await supabaseAdmin.from('auto_gift_data_access').delete().eq('user_id', userId);

    // Delete connections
    await supabaseAdmin.from('user_connections').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_connections').delete().eq('connected_user_id', userId);

    // Delete wishlists
    await supabaseAdmin.from('wishlist_items').delete().eq('user_id', userId);
    await supabaseAdmin.from('wishlists').delete().eq('user_id', userId);

    // Delete messages
    await supabaseAdmin.from('messages').delete().eq('sender_id', userId);
    await supabaseAdmin.from('messages').delete().eq('recipient_id', userId);

    // Delete special dates and addresses
    await supabaseAdmin.from('user_special_dates').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_addresses').delete().eq('user_id', userId);

    // Delete payment methods
    await supabaseAdmin.from('payment_methods').delete().eq('user_id', userId);

    // Delete email preferences and notifications
    await supabaseAdmin.from('email_preferences').delete().eq('user_id', userId);
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

    // Delete AI and search data
    await supabaseAdmin.from('ai_gift_searches').delete().eq('user_id', userId);
    await supabaseAdmin.from('conversation_threads').delete().eq('user_id', userId);

    // Delete profile last (has dependencies)
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    console.log(`Deleted all user data for: ${userId}`);

    // Queue account deletion confirmation email
    if (userEmail) {
      await supabaseAdmin.from('email_queue').insert({
        recipient_email: userEmail,
        recipient_name: user.user_metadata?.name || 'User',
        event_type: 'account_deleted',
        template_variables: {
          userName: user.user_metadata?.name || 'User',
          deletionDate: new Date().toISOString(),
        },
        priority: 'high',
        scheduled_for: new Date().toISOString(),
      });
      console.log(`Queued account deletion email for: ${userEmail}`);
    }

    // Delete the auth user (this will cascade to any remaining auth-related data)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account deleted successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete user data',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
