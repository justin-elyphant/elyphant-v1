/**
 * useConnectionsAdapter - Thin adapter layer for UI compatibility
 * 
 * This hook transforms EnhancedConnection data to the UI-compatible Connection format.
 * It's a lightweight wrapper around useEnhancedConnections.
 * 
 * For new components, consider using useEnhancedConnections directly.
 */

import { useMemo, useCallback } from "react";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useConnectionSuggestions } from "@/hooks/useConnectionSuggestions";
import { Connection, RelationshipType } from "@/types/connections";
import { useAuth } from "@/contexts/auth";

export const useConnectionsAdapter = () => {
  const { user } = useAuth();
  const { 
    connections,
    pendingRequests,
    pendingInvitations,
    followers,
    following,
    loading,
    error,
    fetchConnections: refetchConnections
  } = useEnhancedConnections();

  const { suggestions, loading: suggestionsLoading } = useConnectionSuggestions();

  // Transform enhanced connections into UI-compatible format
  const transformedConnections = useMemo(() => {
    return connections.map(conn => {
      const targetUserId = conn.user_id === user?.id ? conn.connected_user_id : conn.user_id;
      
      return {
        id: targetUserId || conn.id,
        connectionId: conn.id,
        name: conn.profile_name || 'Unknown User',
        username: conn.profile_username || '@unknown',
        imageUrl: conn.profile_image || '/placeholder.svg',
        mutualFriends: 0,
        type: 'friend' as const,
        lastActive: 'Recently',
        relationship: conn.relationship_type as RelationshipType,
        dataStatus: {
          shipping: 'missing' as const,
          birthday: 'missing' as const,
          email: 'missing' as const
        },
        interests: [],
        bio: conn.profile_bio || '',
      } as Connection;
    });
  }, [connections, user]);

  const transformedFollowing = useMemo(() => {
    return following.map(conn => ({
      id: conn.id,
      name: conn.profile_name || 'Following User',
      username: conn.profile_username || '@following',
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

  // Combine pending requests and invitations
  const pendingConnections = useMemo(() => {
    const fromRequests = pendingRequests.map(conn => ({
      id: conn.user_id,
      connectionId: conn.id,
      name: conn.profile_name || 'Unknown',
      username: conn.profile_username || '',
      imageUrl: conn.profile_image || '/placeholder.svg',
      mutualFriends: 0,
      type: 'friend' as const,
      lastActive: 'recently',
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: 'missing' as const,
        birthday: 'missing' as const,
        email: 'missing' as const
      },
      bio: conn.profile_bio,
      isPending: true,
      isIncoming: true,
      connectionDate: conn.created_at
    }));

    const fromInvitations = pendingInvitations.map(conn => ({
      id: conn.id,
      connectionId: conn.id,
      name: conn.profile_name || conn.pending_recipient_name || 'Unknown User',
      username: conn.profile_username || `@${conn.pending_recipient_email?.split('@')[0] || 'unknown'}`,
      imageUrl: conn.profile_image || '/placeholder.svg',
      mutualFriends: 0,
      type: 'suggestion' as const,
      lastActive: 'Invitation Sent',
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: 'missing' as const,
        birthday: 'missing' as const,
        email: 'verified' as const
      },
      interests: [],
      bio: `Pending invitation sent to ${conn.pending_recipient_email || conn.profile_email}`,
      connectionDate: conn.created_at,
      isPending: true,
      recipientEmail: conn.pending_recipient_email || conn.profile_email,
      status: conn.status
    }));

    return [...fromRequests, ...fromInvitations];
  }, [pendingRequests, pendingInvitations]);

  // Filter friends from transformed connections
  const friends = transformedConnections.filter(conn => 
    conn.type === 'friend'
  );

  // Handle relationship change (placeholder - can be extended)
  const handleRelationshipChange = useCallback(async (
    connectionId: string, 
    newRelationship: RelationshipType
  ) => {
    console.log('Update relationship:', connectionId, newRelationship);
    // TODO: Implement relationship update in the database
  }, []);

  // Handle verification request (placeholder)
  const handleSendVerificationRequest = useCallback(async (
    connectionId: string, 
    dataType: keyof Connection['dataStatus']
  ) => {
    console.log('Send verification request:', connectionId, dataType);
    // TODO: Implement verification request
  }, []);

  // Refresh pending connections
  const refreshPendingConnections = useCallback(async () => {
    await refetchConnections();
  }, [refetchConnections]);

  return {
    // UI-compatible transformed data
    connections: transformedConnections,
    friends,
    following: transformedFollowing,
    suggestions: suggestions || [],
    pendingConnections,
    
    // Loading states
    loading: loading || suggestionsLoading,
    error,
    
    // Actions
    handleRelationshipChange,
    handleSendVerificationRequest,
    refreshPendingConnections,
    refetchConnections
  };
};
