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
  pending_shipping_address?: any;
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
      // First fetch connections and explicitly get both directions for permission checking
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('user_connections')
        .select('*')
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);
      
      if (connectionsError) throw connectionsError;
      
      // Then fetch profile data for each connection while respecting RLS
      const enhancedConnections = await Promise.all((connectionsData || []).map(async conn => {
        const isUserInitiated = conn.user_id === user.id;
        const targetUserId = isUserInitiated ? conn.connected_user_id : conn.user_id;
        
        let profile = null;
        
        // Use can_view_profile function to check access and get profile data if allowed
        if (targetUserId) {
          try {
            const { data: canView } = await supabase
              .rpc('can_view_profile', {
                profile_user_id: targetUserId
              });
            
            if (canView) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, name, email, profile_image, bio, username, interests, important_dates')
                .eq('id', targetUserId)
                .single();
              
              profile = profileData;
            }
          } catch (error) {
            console.log('Profile access denied for user:', targetUserId);
          }
        }
        
        // Handle both regular connections and pending invitations
        let profileName = profile?.name;
        let profileEmail = profile?.email;
        let profileUsername = profile?.username;
        
        // For pending invitations, use the pending recipient data
        if (conn.status === 'pending_invitation') {
          profileName = conn.pending_recipient_name || profileName;
          profileEmail = conn.pending_recipient_email || profileEmail;
          profileUsername = conn.pending_recipient_name 
            ? `@${conn.pending_recipient_name.toLowerCase().replace(/\s+/g, '')}`
            : profileUsername;
        }
        
        // Improved fallback handling - show actual names when available
        // Only use fallback if we don't already have a name from pending invitation or profile
        const fallbackId = targetUserId || conn.id;
        const fallbackName = profileName || (profile ? 'Private User' : `User ${fallbackId?.substring(0, 8) || 'Unknown'}`);
        const fallbackUsername = profileUsername || (profile ? '@private' : `@user${fallbackId?.substring(0, 6) || 'unknown'}`);
        
        return {
          ...conn,
          profile_name: fallbackName,
          profile_email: profileEmail,
          profile_image: profile?.profile_image || '/placeholder.svg',
          profile_bio: profile?.bio || '',
          profile_username: fallbackUsername,
          display_user_id: targetUserId,
          is_pending_invitation: conn.status === 'pending_invitation'
        };
      }));
      
      // Deduplicate connections by the other user's ID to avoid showing duplicates
      // Each connection should only appear once regardless of bidirectionality
      console.log('🔍 [useEnhancedConnections] Before deduplication:', enhancedConnections.length, 'connections');
      enhancedConnections.forEach((conn, idx) => {
        const otherUserId = conn.user_id === user.id ? conn.connected_user_id : conn.user_id;
        console.log(`🔍 [useEnhancedConnections] Connection ${idx}:`, {
          id: conn.id,
          user_id: conn.user_id,
          connected_user_id: conn.connected_user_id,
          otherUserId,
          status: conn.status,
          profile_name: conn.profile_name
        });
      });
      
      // Use a more robust deduplication strategy
      const uniqueConnections = new Map<string, typeof enhancedConnections[0]>();
      
      enhancedConnections.forEach(conn => {
        // For pending invitations, use connection id since connected_user_id is null
        const uniqueKey = conn.status === 'pending_invitation' 
          ? conn.id 
          : (conn.user_id === user.id ? conn.connected_user_id : conn.user_id);
        
        if (!uniqueKey) {
          console.log('🔍 [useEnhancedConnections] Skipping connection with no unique key:', conn.id);
          return;
        }
        
        // Check if we already have this connection
        if (uniqueConnections.has(uniqueKey)) {
          console.log('🔍 [useEnhancedConnections] Skipping duplicate connection for key:', uniqueKey, conn.profile_name);
          return;
        }
        
        // Include all connections involving the current user
        if (conn.user_id === user.id || conn.connected_user_id === user.id || conn.status === 'pending_invitation') {
          console.log('🔍 [useEnhancedConnections] Adding unique connection for key:', uniqueKey, conn.profile_name);
          uniqueConnections.set(uniqueKey, conn);
        } else {
          console.log('🔍 [useEnhancedConnections] Skipping connection not involving current user:', conn.id);
        }
      });
      
      const deduplicatedConnections = Array.from(uniqueConnections.values());
      console.log('🔍 [useEnhancedConnections] After deduplication:', deduplicatedConnections.length, 'connections');
      
      // Separate different types of connections
      const accepted = deduplicatedConnections.filter(conn => conn.status === 'accepted');
      const pending = deduplicatedConnections.filter(conn => 
        conn.status === 'pending' && conn.connected_user_id === user.id
      );
      
      // Pending invitations that the user has sent
      const invitations = deduplicatedConnections.filter(conn => 
        conn.status === 'pending_invitation' && conn.user_id === user.id
      );
      
      // Separate followers and following for follow relationships
      const followerConnections = deduplicatedConnections.filter(conn => 
        conn.connected_user_id === user.id && 
        conn.relationship_type === 'follow' && 
        conn.status === 'accepted'
      );
      
      const followingConnections = deduplicatedConnections.filter(conn => 
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
        .rpc('can_user_connect', {
          requester_id: user.id,
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
            shipping_address: true,
            dob: true,
            email: true,
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
