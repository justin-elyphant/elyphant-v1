import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlockState {
  isBlocked: boolean;
  loading: boolean;
}

export const useBlock = (targetUserId: string) => {
  const [blockState, setBlockState] = useState<BlockState>({
    isBlocked: false,
    loading: false
  });

  const checkBlockStatus = useCallback(async () => {
    if (!targetUserId) return;
    
    setBlockState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', currentUser.user.id)
        .eq('blocked_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking block status:', error);
        return;
      }

      setBlockState(prev => ({ 
        ...prev, 
        isBlocked: !!data,
        loading: false 
      }));
    } catch (error) {
      console.error('Error checking block status:', error);
      setBlockState(prev => ({ ...prev, loading: false }));
    }
  }, [targetUserId]);

  const blockUser = useCallback(async (reason?: string) => {
    if (!targetUserId) return;
    
    setBlockState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: currentUser.user.id,
          blocked_id: targetUserId,
          reason: reason || null
        });

      if (error) {
        toast.error('Failed to block user');
        console.error('Error blocking user:', error);
        return;
      }

      // Remove any existing connections
      await supabase
        .from('user_connections')
        .delete()
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUser.user.id})`);

      setBlockState({ isBlocked: true, loading: false });
      toast.success('User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
      setBlockState(prev => ({ ...prev, loading: false }));
    }
  }, [targetUserId]);

  const unblockUser = useCallback(async () => {
    if (!targetUserId) return;
    
    setBlockState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', currentUser.user.id)
        .eq('blocked_id', targetUserId);

      if (error) {
        toast.error('Failed to unblock user');
        console.error('Error unblocking user:', error);
        return;
      }

      setBlockState({ isBlocked: false, loading: false });
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
      setBlockState(prev => ({ ...prev, loading: false }));
    }
  }, [targetUserId]);

  return {
    blockState,
    checkBlockStatus,
    blockUser,
    unblockUser,
    loading: blockState.loading
  };
};