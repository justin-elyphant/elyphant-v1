import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserConnection } from "@/types/supabase";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserConnection[]>([]);
  const [followers, setFollowers] = useState<UserConnection[]>([]);
  const [following, setFollowing] = useState<UserConnection[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all connections where user is either the requester or receiver
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('user_connections')
        .select('*')
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);
      
      if (connectionsError) throw connectionsError;
      
      // Get blocked users
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_users')
        .select('*, blocked_id(*)')
        .eq('blocker_id', user.id);
      
      if (blockedError) throw blockedError;
      
      const allConnections = connectionsData || [];
      
      // Separate different types of connections
      const accepted = allConnections.filter(conn => conn.status === 'accepted');
      const pending = allConnections.filter(conn => 
        conn.status === 'pending' && conn.connected_user_id === user.id
      );
      
      // Separate followers and following for follow relationships
      const followerConnections = allConnections.filter(conn => 
        conn.connected_user_id === user.id && 
        conn.relationship_type === 'follow' && 
        conn.status === 'accepted'
      );
      
      const followingConnections = allConnections.filter(conn => 
        conn.user_id === user.id && 
        conn.relationship_type === 'follow' && 
        conn.status === 'accepted'
      );
      
      // Type cast database results to match our interface
      setConnections(accepted as any[]);
      setPendingRequests(pending as any[]);
      setFollowers(followerConnections as any[]);
      setFollowing(followingConnections as any[]);
      setBlockedUsers(blockedData || []);
    } catch (err) {
      console.error("Error fetching connections:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  /**
   * Send a connection request using the unified connection service
   * Email notifications are handled automatically via database triggers
   */
  const sendConnectionRequest = async (connectedUserId: string, relationshipType: string) => {
    if (!user) {
      toast.error("You must be logged in to send a connection request");
      return null;
    }
    
    try {
      // Check if user can connect first
      const { data: canConnect } = await supabase
        .rpc('can_user_connect', {
          requester_id: user.id,
          target_id: connectedUserId
        });
        
      if (!canConnect) {
        toast.error("Unable to connect with this user");
        return null;
      }
      
      // Use unified connection service (handles email automatically via triggers)
      const { sendConnectionRequest: unifiedSendRequest } = await import('@/services/connections/connectionService');
      const result = await unifiedSendRequest(connectedUserId, relationshipType as any);
      
      if (!result.success) {
        throw result.error || new Error('Failed to send connection request');
      }
      
      toast.success(
        relationshipType === 'follow' 
          ? "Successfully followed user" 
          : "Connection request sent"
      );
      
      // Refresh connections
      await fetchConnections();
      
      return result.data;
    } catch (err) {
      console.error("Error sending connection request:", err);
      toast.error("Failed to send connection request");
      throw err;
    }
  };

  /**
   * Accept a connection request using the unified connection service
   * Acceptance emails are handled automatically via database triggers
   */
  const acceptConnectionRequest = async (connectionId: string) => {
    if (!user) {
      toast.error("You must be logged in to accept a connection request");
      return null;
    }
    
    try {
      // Use unified connection service (handles emails automatically via triggers)
      const { acceptConnectionRequest: unifiedAccept } = await import('@/services/connections/connectionService');
      const result = await unifiedAccept(connectionId);
      
      if (!result.success) {
        throw result.error || new Error('Failed to accept connection request');
      }
      
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      // Refresh to get updated connections
      await fetchConnections();
      
      return result.data;
    } catch (err) {
      console.error("Error accepting connection request:", err);
      toast.error("Failed to accept connection request");
      throw err;
    }
  };

  /**
   * Reject a connection request using the unified connection service
   */
  const rejectConnectionRequest = async (connectionId: string) => {
    if (!user) {
      toast.error("You must be logged in to reject a connection request");
      return null;
    }
    
    try {
      // Use unified connection service
      const { rejectConnectionRequest: unifiedReject } = await import('@/services/connections/connectionService');
      const result = await unifiedReject(connectionId);
      
      if (!result.success) {
        throw result.error || new Error('Failed to reject connection request');
      }
      
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      return result.data;
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
      
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast.success("Connection removed successfully");
      
      return true;
    } catch (err) {
      console.error("Error removing connection:", err);
      toast.error("Failed to remove connection");
      throw err;
    }
  };

  const updateDataAccessPermissions = async (connectionId: string, permissions: {
    dob?: boolean;
    shipping_address?: boolean;
    gift_preferences?: boolean;
  }) => {
    if (!user) {
      toast.error("You must be logged in to update permissions");
      return null;
    }
    
    try {
      // Get current connection to update permissions
      const { data: currentConn, error: fetchError } = await supabase
        .from('user_connections')
        .select('data_access_permissions')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updatedPermissions = {
        ...(currentConn.data_access_permissions as any || {}),
        ...permissions
      };
      
      const { data, error } = await supabase
        .from('user_connections')
        .update({ 
          data_access_permissions: updatedPermissions
        })
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId ? data as any : conn
      ));
      
      toast.success("Access permissions updated");
      return data;
    } catch (err) {
      console.error("Error updating data access permissions:", err);
      toast.error("Failed to update permissions");
      throw err;
    }
  };

  return {
    connections,
    pendingRequests,
    followers,
    following,
    blockedUsers,
    loading,
    error,
    fetchConnections,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection,
    updateDataAccessPermissions
  };
};
