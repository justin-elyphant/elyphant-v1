
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

/**
 * Lightweight hook for nav badge counts.
 * Listens for 'connections-changed' custom events dispatched by useRealtimeConnections
 * instead of maintaining its own Supabase realtime channel.
 */
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
        .in('status', ['pending', 'pending_invitation']);

      if (error) {
        console.error('Error fetching pending connections count:', error);
        return;
      }

      setCount(data?.length || 0);
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

    // Listen for custom event from unified realtime channel
    const handler = () => {
      setTimeout(fetchPendingCount, 500);
    };
    window.addEventListener('connections-changed', handler);

    return () => {
      window.removeEventListener('connections-changed', handler);
    };
  }, [user, fetchPendingCount]);

  return count;
};
