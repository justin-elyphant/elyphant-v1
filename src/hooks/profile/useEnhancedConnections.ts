import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";

export interface EnhancedConnection {
  id: string;
  user_id: string;
  connected_user_id: string | null;
  relationship_type: string;
  status: string;
  created_at: string;
  data_access_permissions: any;
  // Pending invitation fields
  pending_recipient_name?: string;
  pending_recipient_email?: string;
  // Profile data
  profile_name?: string;
  profile_email?: string;
  profile_image?: string;
  profile_bio?: string;
  profile_username?: string;
  // Helper fields
  display_user_id?: string;
  is_pending_invitation?: boolean;
}

export const useEnhancedConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<EnhancedConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EnhancedConnection[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<EnhancedConnection[]>([]);
  const [followers, setFollowers] = useState<EnhancedConnection[]>([]);
  const [following, setFollowing] = useState<EnhancedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnhancedConnections = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setPendingRequests([]);
      setPendingInvitations([]);
      setFollowers([]);
      setFollowing([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch connections with profile data
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('user_connections')
        .select(`
          *,
          connected_profile:profiles!user_connections_connected_user_id_fkey(
            id,
            name,
            email,
            profile_image,
            bio,
            username
          )
        `)
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);
      
      if (connectionsError) throw connectionsError;
      
      // Transform the data to include profile information
      const enhancedConnections = (connectionsData || []).map(conn => {
        const profile = conn.connected_profile;
        const isUserInitiated = conn.user_id === user.id;
        
        // Handle both regular connections and pending invitations
        let profileName = profile?.name;
        let profileEmail = profile?.email;
        let profileUsername = profile?.username;
        
        // For pending invitations, use the pending recipient data
        if (conn.status === 'pending_invitation' && conn.pending_recipient_name) {
          profileName = conn.pending_recipient_name;
          profileEmail = conn.pending_recipient_email;
          profileUsername = `@${conn.pending_recipient_name?.toLowerCase().replace(/\s+/g, '')}`;
        }
        
        // Fallback for display when no data is available
        const fallbackId = conn.connected_user_id || conn.id;
        const fallbackName = profileName || `User ${fallbackId?.substring(0, 8) || 'Unknown'}`;
        const fallbackUsername = profileUsername || `@user${fallbackId?.substring(0, 6) || 'unknown'}`;
        
        return {
          ...conn,
          profile_name: fallbackName,
          profile_email: profileEmail,
          profile_image: profile?.profile_image,
          profile_bio: profile?.bio,
          profile_username: fallbackUsername,
          display_user_id: isUserInitiated ? conn.connected_user_id : conn.user_id,
          is_pending_invitation: conn.status === 'pending_invitation'
        };
      });
      
      // Separate different types of connections
      const accepted = enhancedConnections.filter(conn => conn.status === 'accepted');
      const pending = enhancedConnections.filter(conn => 
        conn.status === 'pending' && conn.connected_user_id === user.id
      );
      
      // Pending invitations that the user has sent
      const invitations = enhancedConnections.filter(conn => 
        conn.status === 'pending_invitation' && conn.user_id === user.id
      );
      
      // Separate followers and following for follow relationships
      const followerConnections = enhancedConnections.filter(conn => 
        conn.connected_user_id === user.id && 
        conn.relationship_type === 'follow' && 
        conn.status === 'accepted'
      );
      
      const followingConnections = enhancedConnections.filter(conn => 
        conn.user_id === user.id && 
        conn.relationship_type === 'follow' && 
        conn.status === 'accepted'
      );
      
      setConnections(accepted);
      setPendingRequests(pending);
      setPendingInvitations(invitations);
      setFollowers(followerConnections);
      setFollowing(followingConnections);
    } catch (err) {
      console.error("Error fetching enhanced connections:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Set empty arrays on error to prevent undefined states
      setConnections([]);
      setPendingRequests([]);
      setPendingInvitations([]);
      setFollowers([]);
      setFollowing([]);
      
      // Show user-friendly error message
      toast.error("Failed to load connections", {
        description: "Please try refreshing the page"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time updates
  useRealtimeConnections(fetchEnhancedConnections);

  useEffect(() => {
    fetchEnhancedConnections();
  }, [fetchEnhancedConnections]);

  const sendConnectionRequest = async (connectedUserId: string, relationshipType: string) => {
    if (!user) {
      toast.error("You must be logged in to send a connection request");
      return null;
    }
    
    try {
      const { data: canFollow } = await supabase
        .rpc('can_user_follow', {
          follower_id: user.id,
          target_id: connectedUserId
        });
        
      if (!canFollow) {
        toast.error("Unable to connect with this user");
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_connections')
        .insert({
          user_id: user.id,
          connected_user_id: connectedUserId,
          relationship_type: relationshipType,
          status: relationshipType === 'follow' ? 'accepted' : 'pending',
          data_access_permissions: {
            dob: false,
            shipping_address: false,
            gift_preferences: false
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(
        relationshipType === 'follow' 
          ? "Successfully followed user" 
          : "Connection request sent"
      );
      
      return data;
    } catch (err) {
      console.error("Error sending connection request:", err);
      toast.error("Failed to send connection request");
      throw err;
    }
  };

  const acceptConnectionRequest = async (connectionId: string) => {
    if (!user) {
      toast.error("You must be logged in to accept a connection request");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)
        .eq('connected_user_id', user.id)
        .eq('status', 'pending')
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Connection request accepted");
      return data;
    } catch (err) {
      console.error("Error accepting connection request:", err);
      toast.error("Failed to accept connection request");
      throw err;
    }
  };

  const rejectConnectionRequest = async (connectionId: string) => {
    if (!user) {
      toast.error("You must be logged in to reject a connection request");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId)
        .eq('connected_user_id', user.id)
        .eq('status', 'pending')
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Connection request rejected");
      return data;
    } catch (err) {
      console.error("Error rejecting connection request:", err);
      toast.error("Failed to reject connection request");
      throw err;
    }
  };

  const removeConnection = async (connectionId: string) => {
    if (!user) {
      toast.error("You must be logged in to remove a connection");
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connectionId)
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);
      
      if (error) throw error;
      
      toast.success("Connection removed successfully");
      return true;
    } catch (err) {
      console.error("Error removing connection:", err);
      toast.error("Failed to remove connection");
      throw err;
    }
  };

  return {
    connections,
    pendingRequests,
    pendingInvitations,
    followers,
    following,
    loading,
    error,
    fetchConnections: fetchEnhancedConnections,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection
  };
};
