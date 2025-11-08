/**
 * Unified Connection Service
 * Single source of truth for all connection-related operations
 * Consolidates logic from useDirectConnect, friendSearchService, and connectionRequestService
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ConnectionStatus = 'connected' | 'pending' | 'none' | 'blocked';
export type RelationshipType = 'friend' | 'family' | 'spouse' | 'cousin' | 'child' | 'custom';

export interface ConnectionRequestResult {
  success: boolean;
  data?: any;
  error?: Error;
}

/**
 * Check the connection status between current user and target user
 */
export const checkConnectionStatus = async (
  currentUserId: string, 
  targetUserId: string
): Promise<ConnectionStatus> => {
  try {
    // Check if either user has blocked the other
    const { data: blockData } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`)
      .limit(1);

    if (blockData && blockData.length > 0) {
      return 'blocked';
    }

    // Check connection status
    const { data: connectionData, error } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`)
      .maybeSingle();

    if (error) throw error;

    if (!connectionData) return 'none';

    return connectionData.status === 'accepted' ? 'connected' : 'pending';
  } catch (error) {
    console.error('Error checking connection status:', error);
    return 'none';
  }
};

/**
 * Send a connection request to another user
 * This will automatically trigger email notification via database trigger
 */
export const sendConnectionRequest = async (
  targetUserId: string,
  relationshipType: RelationshipType = 'friend'
): Promise<ConnectionRequestResult> => {
  console.log('🔗 [connectionService] Starting connection request:', { targetUserId, relationshipType });
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('🔗 [connectionService] Auth error:', authError);
      return { success: false, error: new Error(`Authentication failed: ${authError.message}`) };
    }
    
    if (!user) {
      console.error('🔗 [connectionService] No user found in auth');
      return { success: false, error: new Error('User not authenticated') };
    }

    console.log('🔗 [connectionService] Authenticated user:', user.id);

    // Check for existing connection to prevent duplicates
    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${user.id})`)
      .maybeSingle();

    if (existingConnection) {
      console.log('🔗 [connectionService] Connection already exists:', existingConnection.status);
      return { 
        success: false, 
        error: new Error(`Connection already exists with status: ${existingConnection.status}`) 
      };
    }

    console.log('🔗 [connectionService] Inserting connection request...');
    
    // Insert connection request (database trigger will handle email automatically)
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.id,
        connected_user_id: targetUserId,
        relationship_type: relationshipType,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('🔗 [connectionService] Database error:', error);
      return { 
        success: false, 
        error: new Error(`Database error: ${error.message}`) 
      };
    }

    console.log('🔗 [connectionService] Connection request successful. Email queued automatically via trigger.');
    return { success: true, data };
    
  } catch (error: any) {
    console.error('🔗 [connectionService] Unexpected error:', error);
    return { 
      success: false, 
      error: new Error(`Unexpected error: ${error.message || error}`) 
    };
  }
};

/**
 * Accept a connection request
 * This will automatically trigger acceptance emails via database trigger
 */
export const acceptConnectionRequest = async (requestId: string): Promise<ConnectionRequestResult> => {
  try {
    console.log('🔗 [connectionService] Accepting connection request:', requestId);
    
    // First, fetch the connection and check for auto-gift rules
    const { data: connection } = await supabase
      .from('user_connections')
      .select('user_id, pending_recipient_email')
      .eq('id', requestId)
      .single();
    
    const { error } = await supabase
      .from('user_connections')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('🔗 [connectionService] Error accepting request:', error);
      throw error;
    }
    
    console.log('🔗 [connectionService] Connection accepted. Emails queued automatically via trigger.');
    
    // Check if there are any auto-gift rules waiting for this connection
    if (connection?.user_id && connection?.pending_recipient_email) {
      try {
        const { data: autoGiftRules } = await supabase
          .from('auto_gifting_rules')
          .select('id, user_id, date_type, budget_limit, pending_recipient_email')
          .eq('user_id', connection.user_id)
          .eq('pending_recipient_email', connection.pending_recipient_email)
          .eq('is_active', true);
        
        // Send activation emails for each rule
        if (autoGiftRules && autoGiftRules.length > 0) {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('email, first_name, name')
            .eq('id', connection.user_id)
            .single();
          
          const { data: recipientConnection } = await supabase
            .from('user_connections')
            .select('pending_recipient_name')
            .eq('user_id', connection.user_id)
            .eq('pending_recipient_email', connection.pending_recipient_email)
            .single();
          
          for (const rule of autoGiftRules) {
            if (senderProfile?.email) {
              await supabase.functions.invoke('ecommerce-email-orchestrator', {
                body: {
                  eventType: 'auto_gift_rule_activated',
                  recipientEmail: senderProfile.email,
                  data: {
                    user_email: senderProfile.email,
                    recipient_name: recipientConnection?.pending_recipient_name || 'your recipient',
                    recipient_email: connection.pending_recipient_email,
                    occasion: rule.date_type,
                    budget_limit: rule.budget_limit,
                    is_recurring: true,
                    auto_approve_enabled: false,
                    rule_details: {
                      occasion: rule.date_type,
                      budget_limit: rule.budget_limit,
                      is_recurring: true
                    }
                  }
                }
              });
              console.log('✅ Auto-gift rule activated email sent for rule:', rule.id);
            }
          }
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send auto-gift rule activated email:', emailError);
        // Non-blocking error
      }
    }
    
    toast.success("Connection request accepted!");
    return { success: true };
  } catch (error) {
    console.error('🔗 [connectionService] Error accepting connection request:', error);
    toast.error("Failed to accept connection request");
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Reject a connection request
 */
export const rejectConnectionRequest = async (requestId: string): Promise<ConnectionRequestResult> => {
  try {
    console.log('🔗 [connectionService] Rejecting connection request:', requestId);
    
    const { error } = await supabase
      .from('user_connections')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('🔗 [connectionService] Error rejecting request:', error);
      throw error;
    }
    
    console.log('🔗 [connectionService] Connection request rejected');
    toast.success("Connection request declined");
    return { success: true };
  } catch (error) {
    console.error('🔗 [connectionService] Error rejecting connection request:', error);
    toast.error("Failed to reject connection request");
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Remove an existing connection
 */
export const removeConnection = async (currentUserId: string, targetUserId: string): Promise<ConnectionRequestResult> => {
  try {
    console.log('🔗 [connectionService] Removing connection:', { currentUserId, targetUserId });
    
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`);

    if (error) {
      console.error('🔗 [connectionService] Error removing connection:', error);
      throw error;
    }

    console.log('🔗 [connectionService] Connection removed successfully');
    toast.success('Connection removed');
    return { success: true };
  } catch (error) {
    console.error('🔗 [connectionService] Error removing connection:', error);
    toast.error('Failed to remove connection');
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};
