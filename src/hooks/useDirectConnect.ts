import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConnectState {
  isConnected: boolean;
  isPending: boolean;
  canConnect: boolean;
  loading: boolean;
  connectionType?: 'friend' | 'family';
}

export const useDirectConnect = (targetUserId?: string) => {
  const [connectState, setConnectState] = useState<ConnectState>({
    isConnected: false,
    isPending: false,
    canConnect: true,
    loading: false
  });

  const checkConnectionStatus = useCallback(async () => {
    if (!targetUserId) return;
    
    setConnectState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        setConnectState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check if users are blocked
      const { data: blockData } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${currentUser.user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUser.user.id})`)
        .limit(1);

      if (blockData && blockData.length > 0) {
        setConnectState({
          isConnected: false,
          isPending: false,
          canConnect: false,
          loading: false
        });
        return;
      }

      // Check connection status
      const { data: connectionData } = await supabase
        .from('user_connections')
        .select('status, relationship_type')
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUser.user.id})`)
        .single();

      setConnectState({
        isConnected: connectionData?.status === 'accepted',
        isPending: connectionData?.status === 'pending',
        canConnect: true,
        loading: false,
        connectionType: connectionData?.relationship_type
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectState(prev => ({ ...prev, loading: false }));
    }
  }, [targetUserId]);

  const sendConnectionRequest = useCallback(async () => {
    if (!targetUserId) return;
    
    setConnectState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: currentUser.user.id,
          connected_user_id: targetUserId,
          relationship_type: 'friend',
          status: 'pending'
        });

      if (error) {
        toast.error('Failed to send connection request');
        console.error('Error sending connection request:', error);
        return;
      }

      setConnectState(prev => ({ 
        ...prev, 
        isPending: true,
        loading: false 
      }));
      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
      setConnectState(prev => ({ ...prev, loading: false }));
    }
  }, [targetUserId]);

  const removeConnection = useCallback(async () => {
    if (!targetUserId) return;
    
    setConnectState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { error } = await supabase
        .from('user_connections')
        .delete()
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUser.user.id})`);

      if (error) {
        toast.error('Failed to remove connection');
        console.error('Error removing connection:', error);
        return;
      }

      setConnectState({
        isConnected: false,
        isPending: false,
        canConnect: true,
        loading: false
      });
      toast.success('Connection removed');
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
      setConnectState(prev => ({ ...prev, loading: false }));
    }
  }, [targetUserId]);

  return {
    connectState,
    checkConnectionStatus,
    sendConnectionRequest,
    removeConnection,
    loading: connectState.loading
  };
};