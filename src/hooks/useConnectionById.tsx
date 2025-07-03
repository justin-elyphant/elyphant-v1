
import { useState, useEffect } from "react";
import { Connection, RelationshipType } from "@/types/connections";
import { useConnectionsAdapter } from "./useConnectionsAdapter";
import { toast } from "sonner";

const useConnectionsById = (connectionId: string) => {
  const { connections, handleRelationshipChange, handleSendVerificationRequest } = useConnectionsAdapter();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // In a real app, this would be an API call
    setTimeout(() => {
      const foundConnection = connections.find(c => c.id === connectionId);
      
      if (foundConnection) {
        setConnection(foundConnection);
        setError(null);
      } else {
        setError("Connection not found");
      }
      
      setLoading(false);
    }, 500); // Simulate network delay
  }, [connectionId, connections]);

  const updateRelationship = (newRelationship: RelationshipType, customValue?: string) => {
    if (!connection) return;
    
    handleRelationshipChange(connectionId, newRelationship, customValue);
    
    // Update local state to reflect changes immediately
    setConnection(prev => {
      if (!prev) return null;
      return {
        ...prev,
        relationship: newRelationship,
        customRelationship: customValue
      };
    });
  };

  const sendVerificationRequest = (dataType: keyof Connection['dataStatus']) => {
    if (!connection) return;
    
    handleSendVerificationRequest(connectionId, dataType);
  };

  return {
    connection,
    loading,
    error,
    updateRelationship,
    sendVerificationRequest
  };
};

export default useConnectionsById;
