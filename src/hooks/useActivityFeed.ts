
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { SocialActivityService, SocialActivity } from "@/services/socialActivityService";
import { supabase } from "@/integrations/supabase/client";

export const useActivityFeed = (limit: number = 10) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStats, setConnectionStats] = useState({ accepted: 0, pending: 0, total: 0 });

  const fetchActivities = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [activitiesData, statsData] = await Promise.all([
        SocialActivityService.getRecentActivities(user.id, limit),
        SocialActivityService.getConnectionStats(user.id)
      ]);

      setActivities(activitiesData);
      setConnectionStats(statsData);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  // Initial load
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Set up real-time subscriptions for activity updates
  useEffect(() => {
    if (!user) return;

    console.log('🔔 [useActivityFeed] Setting up real-time listeners');

    const channels = [
      // Listen to connection changes
      supabase
        .channel('activity-connections')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('🔔 Connection activity detected');
          fetchActivities();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `connected_user_id=eq.${user.id}`
        }, () => {
          console.log('🔔 Connection activity detected (recipient)');
          fetchActivities();
        }),

      // Listen to wishlist changes from connected users
      supabase
        .channel('activity-wishlists')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'wishlists'
        }, () => {
          console.log('🔔 Wishlist activity detected');
          // Small delay to avoid too frequent updates
          setTimeout(fetchActivities, 1000);
        }),

      // Listen to new messages
      supabase
        .channel('activity-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          console.log('🔔 Message activity detected');
          fetchActivities();
        })
    ];

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    return () => {
      console.log('🔔 [useActivityFeed] Cleaning up real-time listeners');
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, fetchActivities]);

  const refreshActivities = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    connectionStats,
    loading,
    error,
    refreshActivities
  };
};
