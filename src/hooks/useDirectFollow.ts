
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export interface PrivacySettings {
  allow_follows_from: 'everyone' | 'friends_only' | 'nobody';
  profile_visibility: 'public' | 'followers_only' | 'private';
  block_list_visibility: 'hidden' | 'visible_to_friends';
  show_follower_count: boolean;
  show_following_count: boolean;
  allow_message_requests: boolean;
}

export interface FollowState {
  isFollowing: boolean;
  canFollow: boolean;
  isBlocked: boolean;
  requiresRequest: boolean;
  followerCount: number;
  followingCount: number;
}

export const useDirectFollow = (targetUserId?: string) => {
  const { user } = useAuth();
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: false,
    canFollow: true,
    isBlocked: false,
    requiresRequest: false,
    followerCount: 0,
    followingCount: 0
  });
  const [loading, setLoading] = useState(false);

  const checkFollowStatus = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    try {
      setLoading(true);

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('connected_user_id', targetUserId)
        .eq('relationship_type', 'follow')
        .eq('status', 'accepted')
        .single();

      // Check if user can follow (includes block check)
      const { data: canFollowResult } = await supabase
        .rpc('can_user_follow', {
          follower_id: user.id,
          target_id: targetUserId
        });

      // Check if blocked
      const { data: isBlockedResult } = await supabase
        .rpc('is_user_blocked', {
          user1_id: user.id,
          user2_id: targetUserId
        });

      // Get target user's privacy settings
      const { data: privacySettings } = await supabase
        .rpc('get_user_privacy_settings', {
          target_user_id: targetUserId
        });

      // Get follower/following counts
      const { count: followerCount } = await supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('connected_user_id', targetUserId)
        .eq('relationship_type', 'follow')
        .eq('status', 'accepted');

      const { count: followingCount } = await supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('relationship_type', 'follow')
        .eq('status', 'accepted');

      setFollowState({
        isFollowing: !!existingFollow,
        canFollow: canFollowResult || false,
        isBlocked: isBlockedResult || false,
        requiresRequest: privacySettings?.allow_follows_from === 'friends_only',
        followerCount: followerCount || 0,
        followingCount: followingCount || 0
      });
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId]);

  const followUser = useCallback(async () => {
    if (!user || !targetUserId || followState.isBlocked || !followState.canFollow) {
      toast.error("Unable to follow this user");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: user.id,
          connected_user_id: targetUserId,
          relationship_type: 'follow',
          status: followState.requiresRequest ? 'pending' : 'accepted'
        });

      if (error) throw error;

      // Update local state optimistically
      setFollowState(prev => ({
        ...prev,
        isFollowing: !followState.requiresRequest,
        followerCount: prev.followerCount + 1
      }));

      toast.success(
        followState.requiresRequest 
          ? "Follow request sent" 
          : "Successfully followed user"
      );
    } catch (error) {
      console.error('Error following user:', error);
      toast.error("Failed to follow user");
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, followState]);

  const unfollowUser = useCallback(async () => {
    if (!user || !targetUserId) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('connected_user_id', targetUserId)
        .eq('relationship_type', 'follow');

      if (error) throw error;

      setFollowState(prev => ({
        ...prev,
        isFollowing: false,
        followerCount: Math.max(0, prev.followerCount - 1)
      }));

      toast.success("Successfully unfollowed user");
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error("Failed to unfollow user");
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId]);

  const blockUser = useCallback(async (reason?: string) => {
    if (!user || !targetUserId) return;

    try {
      setLoading(true);

      // Remove any existing follow relationship
      await supabase
        .from('user_connections')
        .delete()
        .or(`and(user_id.eq.${user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${user.id})`);

      // Add to blocked users
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: targetUserId,
          reason
        });

      if (error) throw error;

      setFollowState(prev => ({
        ...prev,
        isFollowing: false,
        isBlocked: true,
        canFollow: false
      }));

      toast.success("User blocked successfully");
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error("Failed to block user");
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId]);

  const unblockUser = useCallback(async () => {
    if (!user || !targetUserId) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId);

      if (error) throw error;

      // Refresh follow status
      await checkFollowStatus();

      toast.success("User unblocked successfully");
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error("Failed to unblock user");
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, checkFollowStatus]);

  return {
    followState,
    loading,
    checkFollowStatus,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser
  };
};
