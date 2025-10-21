
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
    
    // First get the connection records
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [connectionRequestService] Error fetching incoming requests:', error);
      throw error;
    }
    
    if (!connections || connections.length === 0) {
      console.log('✅ [connectionRequestService] No incoming requests found');
      return [];
    }

    // Get all unique user_ids (requesters)
    const requesterIds = connections
      .map(c => c.user_id)
      .filter((id): id is string => id !== null);

    // Fetch profiles for all requesters
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, profile_image, bio')
      .in('id', requesterIds);

    if (profilesError) {
      console.error('❌ [connectionRequestService] Error fetching profiles:', profilesError);
    }

    // Create a map of profiles by id
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Merge connections with profiles
    const enrichedConnections = connections.map(conn => ({
      ...conn,
      requester_profile: profileMap.get(conn.user_id) || undefined,
      status: conn.status as "pending" | "accepted" | "rejected"
    }));
    
    console.log('✅ [connectionRequestService] Incoming requests fetched:', enrichedConnections.length);
    return enrichedConnections;
  } catch (error) {
    console.error('❌ [connectionRequestService] Error in getIncomingConnectionRequests:', error);
    return [];
  }
};

export const getOutgoingConnectionRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    console.log('📡 [connectionRequestService] Fetching outgoing requests for userId:', userId);
    
    // First get the connection records
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [connectionRequestService] Error fetching outgoing requests:', error);
      throw error;
    }
    
    if (!connections || connections.length === 0) {
      console.log('✅ [connectionRequestService] No outgoing requests found');
      return [];
    }

    // Get all unique connected_user_ids
    const connectedUserIds = connections
      .map(c => c.connected_user_id)
      .filter((id): id is string => id !== null);

    // Fetch profiles for all connected users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, profile_image, bio')
      .in('id', connectedUserIds);

    if (profilesError) {
      console.error('❌ [connectionRequestService] Error fetching profiles:', profilesError);
    }

    // Create a map of profiles by id
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Merge connections with profiles
    const enrichedConnections = connections.map(conn => ({
      ...conn,
      recipient_profile: profileMap.get(conn.connected_user_id) || undefined,
      status: conn.status as "pending" | "accepted" | "rejected"
    }));
    
    console.log('✅ [connectionRequestService] Outgoing requests fetched:', enrichedConnections.length, 'Raw data:', enrichedConnections);
    return enrichedConnections;
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
export const cancelConnectionRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📡 [connectionRequestService] Canceling connection request:', requestId);
    
    const { error } = await supabase
      .from('user_connections')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) {
      console.error('❌ [connectionRequestService] Error canceling request:', error);
      throw error;
    }
    
    console.log('✅ [connectionRequestService] Connection request canceled');
    toast.success("Connection request canceled");
    return { success: true };
  } catch (error) {
    console.error('❌ [connectionRequestService] Error canceling connection request:', error);
    toast.error("Failed to cancel connection request");
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
