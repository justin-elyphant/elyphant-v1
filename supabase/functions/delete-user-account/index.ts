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

    // Helper function to safely delete with error logging
    const safeDelete = async (tableName: string, column: string, value: any) => {
      try {
        const { error } = await supabaseAdmin.from(tableName).delete().eq(column, value);
        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
        } else {
          console.log(`✓ Deleted from ${tableName}`);
        }
      } catch (err) {
        console.error(`Exception deleting from ${tableName}:`, err);
      }
    };

    // Delete user data from all tables (in order of foreign key dependencies)

    // Delete group gifts and contributions
    await safeDelete('group_gift_contributions', 'contributor_id', userId);
    await safeDelete('group_gift_projects', 'coordinator_id', userId);
    
    // Delete order-related data (order_items table was removed)
    await safeDelete('orders', 'user_id', userId);

    // Delete auto-gifting data
    await safeDelete('automated_gift_executions', 'user_id', userId);
    await safeDelete('auto_gifting_rules', 'user_id', userId);
    await safeDelete('auto_gifting_settings', 'user_id', userId);
    await safeDelete('auto_gift_notifications', 'user_id', userId);
    await safeDelete('auto_gift_event_logs', 'user_id', userId);
    await safeDelete('auto_gift_data_access', 'user_id', userId);
    await safeDelete('approval_conversations', 'user_id', userId);
    await safeDelete('email_approval_tokens', 'user_id', userId);

    // Delete connections and related data
    await safeDelete('user_connections', 'user_id', userId);
    await safeDelete('user_connections', 'connected_user_id', userId);
    await safeDelete('connection_nudges', 'user_id', userId);
    await safeDelete('blocked_users', 'blocker_id', userId);
    await safeDelete('blocked_users', 'blocked_id', userId);

    // Delete address data
    await safeDelete('address_requests', 'requester_id', userId);
    await safeDelete('address_requests', 'recipient_id', userId);
    await safeDelete('address_intelligence', 'user_id', userId);
    await safeDelete('user_addresses', 'user_id', userId);

    // Delete wishlists and items
    await safeDelete('wishlist_items', 'user_id', userId);
    await safeDelete('wishlists', 'user_id', userId);

    // Delete messages and group chats
    await safeDelete('messages', 'sender_id', userId);
    await safeDelete('messages', 'recipient_id', userId);
    await safeDelete('group_chat_members', 'user_id', userId);
    await safeDelete('group_chats', 'creator_id', userId);

    // Delete gift-related data
    await safeDelete('gift_proposal_votes', 'user_id', userId);
    await safeDelete('gift_searches', 'user_id', userId);
    await safeDelete('gift_templates', 'user_id', userId);
    await safeDelete('gift_recommendations', 'user_id', userId);
    await safeDelete('gift_invitation_analytics', 'user_id', userId);
    await safeDelete('gift_intelligence_cache', 'user_id', userId);

    // Delete special dates
    await safeDelete('user_special_dates', 'user_id', userId);

    // Delete payment methods
    await safeDelete('payment_methods', 'user_id', userId);

    // Delete email and notification data
    await safeDelete('email_preferences', 'user_id', userId);
    await safeDelete('notifications', 'user_id', userId);
    await safeDelete('birthday_email_tracking', 'user_id', userId);

    // Delete AI and analytics data
    await safeDelete('ai_gift_searches', 'user_id', userId);
    await safeDelete('ai_suggestion_insights', 'user_id', userId);
    await safeDelete('conversation_threads', 'user_id', userId);
    await safeDelete('profile_completion_analytics', 'user_id', userId);
    await safeDelete('user_type_audit_log', 'user_id', userId);

    // Delete profile last (has dependencies)
    await safeDelete('profiles', 'id', userId);

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
