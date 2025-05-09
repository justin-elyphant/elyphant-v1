
import { useState, useEffect } from "react";
import useConnectionById from "@/hooks/useConnectionById";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

export const useConnection = (connectionId: string) => {
  const { connection, loading: connectionLoading, error, updateRelationship } = useConnectionById(connectionId);
  const [isMessagingEnabled, setIsMessagingEnabled] = useState(false);
  
  const { status: connectionStatus, loading: statusLoading } = 
    useConnectionStatus(connection?.id);
  
  // Check if messaging is enabled for this connection
  useEffect(() => {
    if (connection) {
      // Enable messaging for accepted connections
      setIsMessagingEnabled(connectionStatus === 'accepted');
    }
  }, [connection, connectionStatus]);

  return {
    connection,
    connectionStatus,
    loading: connectionLoading || statusLoading,
    error,
    isMessagingEnabled,
    updateRelationship
  };
};
