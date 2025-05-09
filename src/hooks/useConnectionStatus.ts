import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export type ConnectionStatus = "none" | "pending" | "accepted" | "rejected" | "blocked";

export const useConnectionStatus = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user || !targetUserId || user.id === targetUserId) {
        setStatus("none");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // First check if there's a direct connection where current user initiated
        const { data: outgoingConnection, error: outgoingError } = await supabase
          .from('user_connections')
          .select('status')
          .eq('user_id', user.id)
          .eq('connected_user_id', targetUserId)
          .maybeSingle();
          
        if (outgoingError) {
          throw outgoingError;
        }
        
        // If found, return this status
        if (outgoingConnection) {
          setStatus(outgoingConnection.status as ConnectionStatus);
          setLoading(false);
          return;
        }
        
        // Otherwise check if there's a connection where target user initiated
        const { data: incomingConnection, error: incomingError } = await supabase
          .from('user_connections')
          .select('status')
          .eq('user_id', targetUserId)
          .eq('connected_user_id', user.id)
          .maybeSingle();
        
        if (incomingError) {
          throw incomingError;
        }
        
        // If found, return this status
        if (incomingConnection) {
          setStatus(incomingConnection.status as ConnectionStatus);
        } else {
          // No connection found
          setStatus("none");
        }
        
      } catch (err) {
        console.error("Error checking connection status:", err);
        setError(err instanceof Error ? err : new Error('Unknown error checking connection'));
        setStatus("none");
      } finally {
        setLoading(false);
      }
    };
    
    checkConnectionStatus();
  }, [user, targetUserId]);
  
  return { status, loading, error };
};
