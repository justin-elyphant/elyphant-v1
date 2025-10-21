
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConnectionRequest {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  relationship_type: string;
  created_at: string;
  requester_profile?: {
    name: string;
    username: string;
    profile_image?: string;
    bio?: string;
  };
  recipient_profile?: {
    name: string;
    username: string;
    profile_image?: string;
    bio?: string;
  };
}

export const getIncomingConnectionRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    console.log('📡 [connectionRequestService] Fetching incoming requests for userId:', userId);
    
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        *,
        requester_profile:profiles!user_connections_user_id_fkey(name, username, profile_image, bio)
      `)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [connectionRequestService] Error fetching incoming requests:', error);
      throw error;
    }
    
    console.log('✅ [connectionRequestService] Incoming requests fetched:', data?.length || 0);
    return (data || []).map(req => ({
      ...req,
      status: req.status as "pending" | "accepted" | "rejected"
    }));
  } catch (error) {
    console.error('❌ [connectionRequestService] Error in getIncomingConnectionRequests:', error);
    return [];
  }
};

export const getOutgoingConnectionRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    console.log('📡 [connectionRequestService] Fetching outgoing requests for userId:', userId);
    
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        *,
        recipient_profile:profiles!user_connections_connected_user_id_fkey(name, username, profile_image, bio)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [connectionRequestService] Error fetching outgoing requests:', error);
      throw error;
    }
    
    console.log('✅ [connectionRequestService] Outgoing requests fetched:', data?.length || 0, 'Raw data:', data);
    return (data || []).map(req => ({
      ...req,
      status: req.status as "pending" | "accepted" | "rejected"
    }));
  } catch (error) {
    console.error('❌ [connectionRequestService] Error in getOutgoingConnectionRequests:', error);
    return [];
  }
};

export const acceptConnectionRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📡 [connectionRequestService] Accepting connection request:', requestId);
    
    const { error } = await supabase
      .from('user_connections')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('❌ [connectionRequestService] Error accepting request:', error);
      throw error;
    }
    
    console.log('✅ [connectionRequestService] Connection request accepted');
    toast.success("Connection request accepted!");
    return { success: true };
  } catch (error) {
    console.error('❌ [connectionRequestService] Error accepting connection request:', error);
    toast.error("Failed to accept connection request");
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const rejectConnectionRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📡 [connectionRequestService] Rejecting connection request:', requestId);
    
    const { error } = await supabase
      .from('user_connections')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('❌ [connectionRequestService] Error rejecting request:', error);
      throw error;
    }
    
    console.log('✅ [connectionRequestService] Connection request rejected');
    toast.success("Connection request declined");
    return { success: true };
  } catch (error) {
    console.error('❌ [connectionRequestService] Error rejecting connection request:', error);
    toast.error("Failed to reject connection request");
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Send a connection nudge/reminder
 * Note: Regular connection invitations are now handled automatically via database triggers.
 * This function is only for manual nudges/reminders to existing pending connections.
 */
export const sendConnectionNudge = async (connectionId: string, customMessage?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📡 [connectionRequestService] Sending connection nudge for:', connectionId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('user_connections')
      .select(`
        *,
        recipient_profile:profiles!user_connections_connected_user_id_fkey(name, username, email)
      `)
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found');
    }

    // Insert nudge record
    const { error: nudgeError } = await supabase
      .from('connection_nudges')
      .insert({
        user_id: user.id,
        recipient_email: connection.recipient_profile?.email || `${connection.recipient_profile?.username}@example.com`,
        connection_id: connectionId,
        nudge_type: 'manual',
        nudge_method: 'email',
        custom_message: customMessage,
        delivery_status: 'pending'
      });

    if (nudgeError) {
      console.error('❌ [connectionRequestService] Error creating nudge record:', nudgeError);
      throw nudgeError;
    }

    // Manual nudge reminder (separate from automated connection invitations)
    const { error: sendError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'nudge_reminder',
        customData: {
          recipientEmail: connection.recipient_profile?.email || `${connection.recipient_profile?.username}@example.com`,
          recipientName: connection.recipient_profile?.name || 'User',
          senderName: 'Friend',
          customMessage,
          invitationUrl: window.location.origin + '/signup'
        }
      }
    });

    if (sendError) {
      console.error('❌ [connectionRequestService] Error sending nudge:', sendError);
      throw sendError;
    }

    console.log('✅ [connectionRequestService] Connection nudge sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ [connectionRequestService] Error in sendConnectionNudge:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
