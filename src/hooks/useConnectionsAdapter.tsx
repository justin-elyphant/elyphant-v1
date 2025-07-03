
import { useMemo } from "react";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { Connection, RelationshipType } from "@/types/connections";

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
  } = useEnhancedConnections();

  // Transform enhanced connections into UI-compatible format
  const transformedConnections = useMemo(() => {
    return connections.map(conn => ({
      id: conn.id,
      name: conn.profile_name || 'Unknown User',
      username: conn.profile_username || '@unknown',
      imageUrl: conn.profile_image || '/placeholder.svg',
      mutualFriends: 0, // TODO: Calculate mutual friends
      type: conn.status === 'accepted' ? 'friend' as const : 'suggestion' as const,
      lastActive: 'Recently', // TODO: Get last active from profiles
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: conn.data_access_permissions?.shipping_address ? 'verified' as const : 'missing' as const,
        birthday: conn.data_access_permissions?.dob ? 'verified' as const : 'missing' as const,
        email: conn.data_access_permissions?.email ? 'verified' as const : 'missing' as const
      },
      interests: [], // TODO: Get from profiles
      bio: conn.profile_bio || '',
    })) as Connection[];
  }, [connections]);

  const transformedFollowing = useMemo(() => {
    return following.map(conn => ({
      id: conn.id,
      name: conn.profile_name || 'Unknown User',
      username: conn.profile_username || '@unknown',
      imageUrl: conn.profile_image || '/placeholder.svg',
      mutualFriends: 0,
      type: 'following' as const,
      lastActive: 'Recently',
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: 'missing' as const,
        birthday: 'missing' as const,
        email: 'missing' as const
      },
      interests: [],
      bio: conn.profile_bio || '',
    })) as Connection[];
  }, [following]);

  const friends = transformedConnections.filter(conn => 
    conn.type === 'friend' && conn.relationship === 'friend'
  );

  // Generate basic suggestions based on existing connections
  const suggestions: Connection[] = useMemo(() => {
    // This is a placeholder - in a real app, you'd have a more sophisticated algorithm
    return [];
  }, []);

  const handleRelationshipChange = async (connectionId: string, newRelationship: RelationshipType, customValue?: string) => {
    // TODO: Implement relationship update in the database
    console.log('Update relationship:', connectionId, newRelationship, customValue);
  };

  const handleSendVerificationRequest = async (connectionId: string, dataType: keyof Connection['dataStatus']) => {
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
