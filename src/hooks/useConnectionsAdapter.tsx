
import { useMemo } from "react";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useConnectionSuggestions } from "@/hooks/useConnectionSuggestions";
import { useMutualConnections } from "@/hooks/useMutualConnections";
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

  const { suggestions, loading: suggestionsLoading } = useConnectionSuggestions();
  const { calculateMutualFriends } = useMutualConnections();

  // Transform enhanced connections into UI-compatible format
  const transformedConnections = useMemo(() => {
    return connections.map(conn => {
      const connectedUserId = conn.user_id !== conn.connected_user_id 
        ? (conn.user_id === conn.id ? conn.connected_user_id : conn.user_id)
        : conn.connected_user_id;

      return {
        id: conn.id,
        name: conn.profile_name || 'Unknown User',
        username: conn.profile_username || '@unknown',
        imageUrl: conn.profile_image || '/placeholder.svg',
        mutualFriends: 0, // Will be calculated asynchronously
        type: conn.status === 'accepted' ? 'friend' as const : 'suggestion' as const,
        lastActive: 'Recently',
        relationship: conn.relationship_type as RelationshipType,
        dataStatus: {
          shipping: conn.data_access_permissions?.shipping_address ? 'verified' as const : 'missing' as const,
          birthday: conn.data_access_permissions?.dob ? 'verified' as const : 'missing' as const,
          email: conn.data_access_permissions?.email ? 'verified' as const : 'missing' as const
        },
        interests: [],
        bio: conn.profile_bio || '',
      } as Connection;
    });
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

  // Enhanced search filtering
  const filterConnections = (connectionsList: Connection[], searchTerm: string) => {
    if (!searchTerm.trim()) return connectionsList;
    
    const term = searchTerm.toLowerCase();
    return connectionsList.filter(conn => 
      conn.name.toLowerCase().includes(term) ||
      conn.username.toLowerCase().includes(term) ||
      conn.bio.toLowerCase().includes(term) ||
      (conn.interests || []).some(interest => 
        interest.toLowerCase().includes(term)
      )
    );
  };

  const handleRelationshipChange = async (connectionId: string, newRelationship: RelationshipType, customValue?: string) => {
    console.log('Update relationship:', connectionId, newRelationship, customValue);
    // TODO: Implement relationship update in the database
  };

  const handleSendVerificationRequest = async (connectionId: string, dataType: keyof Connection['dataStatus']) => {
    console.log('Send verification request:', connectionId, dataType);
    // TODO: Implement verification request
  };

  return {
    connections: transformedConnections,
    friends,
    following: transformedFollowing,
    suggestions,
    loading: loading || suggestionsLoading,
    error,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection,
    handleRelationshipChange,
    handleSendVerificationRequest,
    filterConnections,
    calculateMutualFriends
  };
};
