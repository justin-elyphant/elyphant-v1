
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const usePendingConnectionsCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('id')
        .eq('connected_user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending connections count:', error);
        return;
      }

      const newCount = data?.length || 0;
      console.log('🔔 [usePendingConnectionsCount] Updated count:', newCount);
      setCount(newCount);
    } catch (error) {
      console.error('Error in fetchPendingCount:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    fetchPendingCount();

    // Set up real-time listener for pending connection changes
    const channel = supabase
      .channel('pending-connections-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `connected_user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 [usePendingConnectionsCount] Real-time update:', payload);
          // Small delay to ensure database consistency
          setTimeout(fetchPendingCount, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPendingCount]);

  return count;
};
