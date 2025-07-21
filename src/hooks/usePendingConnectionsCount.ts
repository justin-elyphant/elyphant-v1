
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const usePendingConnectionsCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const fetchPendingCount = async () => {
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

        setCount(data?.length || 0);
      } catch (error) {
        console.error('Error in fetchPendingCount:', error);
      }
    };

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
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
};
