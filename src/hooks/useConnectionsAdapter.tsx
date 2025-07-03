
import { useMemo } from "react";
import { useConnections as useRealConnections } from "@/hooks/profile/useConnections";
import { Connection, RelationshipType } from "@/types/connections";

// Adapter hook to transform real connection data into the format expected by UI components
export const useConnectionsAdapter = () => {
  const { 
    connections,
    pendingRequests,
    followers,
    following,
    loading,
    error,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection
  } = useRealConnections();

  // Transform real connections into UI-compatible format
  const transformedConnections = useMemo(() => {
    return connections.map(conn => ({
      id: conn.id,
      name: `User ${conn.connected_user_id.substring(0, 8)}`, // Placeholder until we get profile data
      username: `@user${conn.connected_user_id.substring(0, 6)}`,
      imageUrl: '/placeholder.svg',
      mutualFriends: 0, // TODO: Calculate mutual friends
      type: conn.status === 'accepted' ? 'friend' as const : 'suggestion' as const,
      lastActive: 'Unknown', // TODO: Get last active from profiles
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: 'missing' as const,
        birthday: 'missing' as const,
        email: 'missing' as const
      },
      interests: [], // TODO: Get from profiles
      bio: '', // TODO: Get from profiles
    })) as Connection[];
  }, [connections]);

  const transformedFollowing = useMemo(() => {
    return following.map(conn => ({
      id: conn.id,
      name: `User ${conn.connected_user_id.substring(0, 8)}`,
      username: `@user${conn.connected_user_id.substring(0, 6)}`,
      imageUrl: '/placeholder.svg',
      mutualFriends: 0,
      type: 'following' as const,
      lastActive: 'Unknown',
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: 'missing' as const,
        birthday: 'missing' as const,
        email: 'missing' as const
      },
      interests: [],
      bio: '',
    })) as Connection[];
  }, [following]);

  const friends = transformedConnections.filter(conn => 
    conn.type === 'friend' && conn.relationship === 'friend'
  );

  const suggestions: Connection[] = []; // Empty for now - TODO: implement suggestions

  const handleRelationshipChange = (connectionId: string, newRelationship: RelationshipType, customValue?: string) => {
    // TODO: Implement relationship update in the database
    console.log('Update relationship:', connectionId, newRelationship, customValue);
  };

  const handleSendVerificationRequest = (connectionId: string, dataType: keyof Connection['dataStatus']) => {
    // TODO: Implement verification request
    console.log('Send verification request:', connectionId, dataType);
  };

  return {
    connections: transformedConnections,
    friends,
    following: transformedFollowing,
    suggestions,
    loading,
    error,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection,
    handleRelationshipChange,
    handleSendVerificationRequest
  };
};
