
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserConnection } from "@/types/supabase";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all connections where user is either the requester or receiver
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);
      
      if (error) throw error;
      
      const accepted = data?.filter(conn => conn.status === 'accepted') || [];
      const pending = data?.filter(conn => 
        conn.status === 'pending' && conn.connected_user_id === user.id
      ) || [];
      
      setConnections(accepted);
      setPendingRequests(pending);
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

  const sendConnectionRequest = async (connectedUserId: string, relationshipType: string) => {
    if (!user) {
      toast.error("You must be logged in to send a connection request");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .insert({
          user_id: user.id,
          connected_user_id: connectedUserId,
          relationship_type: relationshipType,
          status: 'pending',
          data_access_permissions: {
            dob: false,
            shipping_address: false,
            gift_preferences: false
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Connection request sent");
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
      
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      setConnections(prev => [...prev, data]);
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
      
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
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
        ...currentConn.data_access_permissions,
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
        conn.id === connectionId ? data : conn
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
