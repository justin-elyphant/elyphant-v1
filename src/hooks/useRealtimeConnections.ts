
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

/**
 * Unified realtime listener for all user_connections changes.
 * Dispatches a 'connections-changed' custom event so other hooks
 * (like usePendingConnectionsCount) can react without their own channels.
 */
export const useRealtimeConnections = (onConnectionChange: () => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('connections-unified')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handlePayload(payload, user.id);
          onConnectionChange();
          window.dispatchEvent(new CustomEvent('connections-changed'));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `connected_user_id=eq.${user.id}`
        },
        (payload) => {
          handlePayload(payload, user.id);
          onConnectionChange();
          window.dispatchEvent(new CustomEvent('connections-changed'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onConnectionChange]);
};

function handlePayload(payload: any, currentUserId: string) {
  if (payload.eventType === 'INSERT') {
    const conn = payload.new;
    if (conn.connected_user_id === currentUserId && (conn.status === 'pending' || conn.status === 'pending_invitation')) {
      toast.info("New connection request received!");
    } else if (conn.status === 'accepted') {
      toast.success("Connection request accepted!");
    }
  } else if (payload.eventType === 'UPDATE') {
    const conn = payload.new;
    if (conn.status === 'accepted') {
      toast.success("Connection accepted!");
    } else if (conn.status === 'rejected') {
      toast.info("Connection request declined");
    }
  } else if (payload.eventType === 'DELETE') {
    toast.info("Connection removed");
  }
}
