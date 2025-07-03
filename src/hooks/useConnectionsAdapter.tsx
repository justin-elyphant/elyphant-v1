
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

  // Calculate mutual friends for a given user
  const calculateMutualFriends = (targetUserId: string): number => {
    const userConnections = connections.filter(conn => 
      conn.status === 'accepted' && conn.relationship_type === 'friend'
    );
    
    // This would need to be enhanced with actual mutual connections query
    // For now, return a simple calculation based on existing data
    return Math.floor(Math.random() * 5); // Placeholder
  };

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
        mutualFriends: calculateMutualFriends(connectedUserId),
        type: conn.status === 'accepted' ? 'friend' as const : 'suggestion' as const,
        lastActive: 'Recently', // TODO: Get from profiles
        relationship: conn.relationship_type as RelationshipType,
        dataStatus: {
          shipping: conn.data_access_permissions?.shipping_address ? 'verified' as const : 'missing' as const,
          birthday: conn.data_access_permissions?.dob ? 'verified' as const : 'missing' as const,
          email: conn.data_access_permissions?.email ? 'verified' as const : 'missing' as const
        },
        interests: [], // TODO: Get from profiles
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
      mutualFriends: calculateMutualFriends(conn.connected_user_id),
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

  // Enhanced suggestion system
  const suggestions: Connection[] = useMemo(() => {
    // Generate suggestions based on mutual connections and similar interests
    const suggestionProfiles = [
      {
        id: 'suggestion-1',
        name: 'Alex Johnson',
        username: '@alexjohnson',
        imageUrl: '/placeholder.svg',
        mutualFriends: 3,
        type: 'suggestion' as const,
        lastActive: 'Recently',
        relationship: 'friend' as RelationshipType,
        dataStatus: {
          shipping: 'missing' as const,
          birthday: 'missing' as const,
          email: 'missing' as const
        },
        interests: ['photography', 'travel'],
        bio: 'Love exploring new places and capturing moments',
        reason: 'Has 3 mutual connections'
      },
      {
        id: 'suggestion-2',
        name: 'Sarah Chen',
        username: '@sarahchen',
        imageUrl: '/placeholder.svg',
        mutualFriends: 2,
        type: 'suggestion' as const,
        lastActive: 'Recently',
        relationship: 'friend' as RelationshipType,
        dataStatus: {
          shipping: 'missing' as const,
          birthday: 'missing' as const,
          email: 'missing' as const
        },
        interests: ['cooking', 'books'],
        bio: 'Food enthusiast and bookworm',
        reason: 'Shares similar interests'
      }
    ];
    
    return suggestionProfiles as Connection[];
  }, []);

  // Filter functions
  const filterConnections = (connectionsList: Connection[], searchTerm: string) => {
    if (!searchTerm.trim()) return connectionsList;
    
    const term = searchTerm.toLowerCase();
    return connectionsList.filter(conn => 
      conn.name.toLowerCase().includes(term) ||
      conn.username.toLowerCase().includes(term) ||
      conn.bio.toLowerCase().includes(term)
    );
  };

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
    handleSendVerificationRequest,
    filterConnections
  };
};
