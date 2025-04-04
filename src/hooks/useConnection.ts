
import { useState, useEffect } from "react";
import useConnectionById from "@/hooks/useConnectionById";

export const useConnection = (connectionId: string) => {
  const { connection, loading, error, updateRelationship } = useConnectionById(connectionId);
  const [isMessagingEnabled, setIsMessagingEnabled] = useState(false);
  
  // Check if messaging is enabled for this connection
  useEffect(() => {
    if (connection) {
      // In a real app, we might check connection status or relationship
      // For now, all connections can message each other
      setIsMessagingEnabled(true);
    }
  }, [connection]);

  return {
    connection,
    loading,
    error,
    isMessagingEnabled,
    updateRelationship
  };
};
