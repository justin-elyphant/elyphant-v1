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

    // Delete user data from all tables (in comprehensive order to avoid FK violations)

    // 1. Security and session tables (no FK dependencies)
    await safeDelete('security_logs', 'user_id', userId);
    await safeDelete('security_anomalies', 'user_id', userId);
    await safeDelete('security_audit', 'user_id', userId);
    await safeDelete('trusted_devices', 'user_id', userId);
    await safeDelete('user_sessions', 'user_id', userId);
    
    // 2. Presence and interaction tables
    await safeDelete('user_presence', 'user_id', userId);
    await safeDelete('typing_indicators', 'user_id', userId);
    await safeDelete('user_interaction_events', 'user_id', userId);
    
    // 3. Analytics tables
    await safeDelete('product_analytics', 'user_id', userId);
    await safeDelete('purchase_analytics', 'user_id', userId);
    await safeDelete('gift_recommendation_analytics', 'user_id', userId);
    await safeDelete('nicole_discovery_log', 'user_id', userId);
    await safeDelete('profile_completion_analytics', 'user_id', userId);
    await safeDelete('user_type_audit_log', 'user_id', userId);
    
    // 4. Rate limiting and cost tracking
    await safeDelete('message_rate_limits', 'user_id', userId);
    await safeDelete('zma_order_rate_limits', 'user_id', userId);
    await safeDelete('zma_cost_tracking', 'user_id', userId);
    await safeDelete('zma_security_events', 'user_id', userId);
    
    // 5. Cache and history tables
    await safeDelete('invitation_context_cache', 'user_id', userId);
    await safeDelete('user_search_history', 'user_id', userId);
    await safeDelete('gift_intelligence_cache', 'user_id', userId);
    
    // 6. API and roles
    await safeDelete('api_keys', 'user_id', userId);
    await safeDelete('user_roles', 'user_id', userId);
    
    // 7. Business and vendor tables
    await safeDelete('business_admins', 'user_id', userId);
    await safeDelete('vendor_accounts', 'user_id', userId);
    
    // 8. Rewards and tracking
    await safeDelete('invitation_rewards', 'user_id', userId);
    await safeDelete('group_gift_tracking_access', 'user_id', userId);
    
    // 9. Pending and queue tables
    await safeDelete('pending_gift_invitations', 'inviter_id', userId);
    await safeDelete('pending_gift_invitations', 'invitee_id', userId);
    await safeDelete('offline_message_queue', 'user_id', userId);
    
    // 10. Preferences tables
    await safeDelete('privacy_settings', 'user_id', userId);
    await safeDelete('user_notification_preferences', 'user_id', userId);
    await safeDelete('recipient_preferences', 'user_id', userId);
    await safeDelete('recipient_profiles', 'user_id', userId);
    await safeDelete('recipient_intelligence_profiles', 'user_id', userId);
    await safeDelete('email_preferences', 'user_id', userId);
    
    // 11. Group gifts and contributions
    await safeDelete('group_gift_contributions', 'contributor_id', userId);
    await safeDelete('group_gift_projects', 'coordinator_id', userId);
    await safeDelete('contributions', 'contributor_id', userId);
    await safeDelete('funding_campaigns', 'creator_id', userId);
    
    // 12. Orders and payment methods
    await safeDelete('orders', 'user_id', userId);
    await safeDelete('payment_methods', 'user_id', userId);

    // 13. Auto-gifting data
    await safeDelete('automated_gift_executions', 'user_id', userId);
    await safeDelete('auto_gifting_rules', 'user_id', userId);
    await safeDelete('auto_gifting_settings', 'user_id', userId);
    await safeDelete('auto_gift_notifications', 'user_id', userId);
    await safeDelete('auto_gift_event_logs', 'user_id', userId);
    await safeDelete('auto_gift_data_access', 'user_id', userId);
    await safeDelete('auto_gift_payment_audit', 'user_id', userId);
    await safeDelete('auto_gift_fulfillment_queue', 'user_id', userId);
    await safeDelete('approval_conversations', 'user_id', userId);
    await safeDelete('email_approval_tokens', 'user_id', userId);

    // 14. Connections and related data
    await safeDelete('user_connections', 'user_id', userId);
    await safeDelete('user_connections', 'connected_user_id', userId);
    await safeDelete('connection_nudges', 'user_id', userId);
    await safeDelete('blocked_users', 'blocker_id', userId);
    await safeDelete('blocked_users', 'blocked_id', userId);

    // 15. Address data
    await safeDelete('address_requests', 'requester_id', userId);
    await safeDelete('address_requests', 'recipient_id', userId);
    await safeDelete('address_intelligence', 'user_id', userId);
    await safeDelete('user_addresses', 'user_id', userId);

    // 16. Wishlists and items
    await safeDelete('wishlist_items', 'user_id', userId);
    await safeDelete('wishlist_purchase_tracking', 'purchaser_id', userId);
    await safeDelete('wishlists', 'user_id', userId);

    // 17. Messages and group chats
    await safeDelete('messages', 'sender_id', userId);
    await safeDelete('messages', 'recipient_id', userId);
    await safeDelete('group_chat_members', 'user_id', userId);
    await safeDelete('group_chats', 'creator_id', userId);

    // 18. Gift-related data
    await safeDelete('gift_proposal_votes', 'user_id', userId);
    await safeDelete('gift_searches', 'user_id', userId);
    await safeDelete('gift_templates', 'user_id', userId);
    await safeDelete('gift_recommendations', 'user_id', userId);
    await safeDelete('gift_invitation_analytics', 'user_id', userId);
    await safeDelete('gift_invitation_analytics', 'invited_user_id', userId);
    await safeDelete('gift_preview_tokens', 'recipient_email', userEmail || '');

    // 19. Special dates
    await safeDelete('user_special_dates', 'user_id', userId);

    // 20. Email and notification data
    await safeDelete('notifications', 'user_id', userId);
    await safeDelete('birthday_email_tracking', 'user_id', userId);

    // 21. AI and search data
    await safeDelete('ai_gift_searches', 'user_id', userId);
    await safeDelete('ai_suggestion_insights', 'user_id', userId);
    await safeDelete('conversation_threads', 'user_id', userId);

    // 22. Profile last (has dependencies)
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
