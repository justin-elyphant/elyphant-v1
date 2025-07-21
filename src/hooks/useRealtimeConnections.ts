
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useRealtimeConnections = (onConnectionChange: () => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('🔗 [useRealtimeConnections] No user, skipping realtime setup');
      return;
    }

    console.log('🔗 [useRealtimeConnections] Setting up realtime listeners for user:', user.id);

    // Subscribe to changes in user_connections table
    const channel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔗 [useRealtimeConnections] Connection change detected (as sender):', payload);
          
          // Show toast notifications for connection events
          if (payload.eventType === 'INSERT') {
            const newConnection = payload.new;
            if (newConnection.status === 'pending' && newConnection.connected_user_id === user.id) {
              toast.info("New connection request received!");
            } else if (newConnection.status === 'accepted') {
              toast.success("Connection request accepted!");
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedConnection = payload.new;
            if (updatedConnection.status === 'accepted') {
              toast.success("Connection accepted!");
            } else if (updatedConnection.status === 'rejected') {
              toast.info("Connection request declined");
            }
          } else if (payload.eventType === 'DELETE') {
            toast.info("Connection removed");
          }
          
          // Trigger refresh of connections data
          onConnectionChange();
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
          console.log('🔗 [useRealtimeConnections] Connection change detected (as recipient):', payload);
          
          // Show toast notifications for connection events
          if (payload.eventType === 'INSERT') {
            const newConnection = payload.new;
            if (newConnection.status === 'pending') {
              toast.info("New connection request received!");
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedConnection = payload.new;
            if (updatedConnection.status === 'accepted') {
              toast.success("Connection accepted!");
            } else if (updatedConnection.status === 'rejected') {
              toast.info("Connection request declined");
            }
          }
          
          // Trigger refresh of connections data
          onConnectionChange();
        }
      )
      .subscribe((status) => {
        console.log('🔗 [useRealtimeConnections] Subscription status:', status);
      });

    return () => {
      console.log('🔗 [useRealtimeConnections] Cleaning up realtime listeners');
      supabase.removeChannel(channel);
    };
  }, [user, onConnectionChange]);
};
