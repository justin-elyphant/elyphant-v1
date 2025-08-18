
import { useMemo, useState, useEffect, useCallback } from "react";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useConnectionSuggestions } from "@/hooks/useConnectionSuggestions";
import { useMutualConnections } from "@/hooks/useMutualConnections";
import { Connection, RelationshipType } from "@/types/connections";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { useAuth } from "@/contexts/auth";

// 🚨 MIGRATION NOTICE: Now using UnifiedGiftManagementService instead of pendingGiftsService
import { supabase } from "@/integrations/supabase/client";

export const useConnectionsAdapter = () => {
  const { user } = useAuth();
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
    removeConnection,
    refetch: refetchConnections
  } = useEnhancedConnections();

  const [pendingConnections, setPendingConnections] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { suggestions, loading: suggestionsLoading } = useConnectionSuggestions();
  const { calculateMutualFriends } = useMutualConnections();

  // Add state to track bidirectional permissions
  const [bidirectionalPermissions, setBidirectionalPermissions] = useState<Map<string, any>>(new Map());

  // Fetch bidirectional permissions for each target user
  const fetchBidirectionalPermissions = useCallback(async () => {
    if (!connections || !user) return;

    const permissionsMap = new Map();
    
    // For each unique target user, fetch their permissions to current user
    const uniqueTargetUsers = new Set<string>();
    connections.forEach(conn => {
      const targetUserId = conn.user_id === user.id ? conn.connected_user_id : conn.user_id;
      if (targetUserId) {
        uniqueTargetUsers.add(targetUserId);
      }
    });

    console.log('🔍 [Bidirectional Permissions] Fetching permissions for users:', Array.from(uniqueTargetUsers));

    // Fetch all connection records where these users are grantors to current user
    if (uniqueTargetUsers.size > 0) {
      const targetUserIds = Array.from(uniqueTargetUsers);
      
      const { data: grantorConnections, error } = await supabase
        .from('user_connections')
        .select('user_id, connected_user_id, data_access_permissions')
        .in('user_id', targetUserIds)
        .eq('connected_user_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('❌ [Bidirectional Permissions] Error fetching permissions:', error);
      } else {
        console.log('🔍 [Bidirectional Permissions] Fetched grantor connections:', grantorConnections);
        
        grantorConnections?.forEach(conn => {
          permissionsMap.set(conn.user_id, conn.data_access_permissions || {});
        });
      }
    }

    setBidirectionalPermissions(permissionsMap);
  }, [connections, user]);

  // Fetch bidirectional permissions when connections change
  useEffect(() => {
    fetchBidirectionalPermissions();
  }, [fetchBidirectionalPermissions]);

  // Transform enhanced connections into UI-compatible format
  const transformedConnections = useMemo(() => {
    console.log('🔄 [useConnectionsAdapter] Transforming connections:', connections.length);
    return connections.map(conn => {
      // For accepted connections, we should always show the profile name
      // even if the privacy check fails, since they're already connected
      const isAcceptedConnection = conn.status === 'accepted';
      
      // Use the actual profile data that comes from the connection query
      const displayName = isAcceptedConnection 
        ? (conn.profile_name || conn.name || 'Connected User')
        : (conn.profile_name || 'Unknown User');
        
      const displayUsername = isAcceptedConnection
        ? (conn.profile_username || conn.username || '@connected')
        : (conn.profile_username || '@unknown');

      console.log('🔍 [useConnectionsAdapter] Processing connection:', {
        id: conn.id,
        originalName: conn.profile_name,
        fallbackName: conn.name,
        displayName,
        status: conn.status,
        isAccepted: isAcceptedConnection
      });

      // Determine who is the target user (the one whose card we're displaying)
      const targetUserId = conn.user_id === user?.id ? conn.connected_user_id : conn.user_id;
      
      // CRITICAL FIX: Use bidirectional permissions to get what target user has granted to current user
      const permissionsFromTarget = bidirectionalPermissions.get(targetUserId) || {};
      
      console.log('🔍 [Permission Debug] Using bidirectional permissions:', {
        connectionId: conn.id,
        currentUserId: user?.id,
        targetUserId,
        permissionsFromTarget,
        hasBidirectionalData: bidirectionalPermissions.has(targetUserId),
        allBidirectionalKeys: Array.from(bidirectionalPermissions.keys())
      });
      
      return {
        id: targetUserId, // Use the target user's ID, not the connection ID
        connectionId: conn.id, // Store the actual connection ID for operations
        name: displayName,
        username: displayUsername,
        imageUrl: conn.profile_image || '/placeholder.svg',
        mutualFriends: 0, // Will be calculated asynchronously
        type: isAcceptedConnection ? 'friend' as const : 'suggestion' as const,
        lastActive: 'Recently',
        relationship: conn.relationship_type as RelationshipType,
        dataStatus: {
          shipping: permissionsFromTarget?.shipping_address === false ? 'blocked' as const : 
                   permissionsFromTarget?.shipping_address === true ? 'verified' as const : 'missing' as const,
          birthday: permissionsFromTarget?.dob === false ? 'blocked' as const : 
                   permissionsFromTarget?.dob === true ? 'verified' as const : 'missing' as const,
          email: permissionsFromTarget?.email === false ? 'blocked' as const : 
                 permissionsFromTarget?.email === true ? 'verified' as const : 'missing' as const
        },
        interests: [],
        bio: conn.profile_bio || '',
      } as Connection;
    });
  }, [connections, refreshTrigger, user, bidirectionalPermissions]);

  const transformedFollowing = useMemo(() => {
    return following.map(conn => ({
      id: conn.id,
      name: conn.profile_name || conn.name || 'Following User',
      username: conn.profile_username || conn.username || '@following',
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

  // Filter friends based on accepted status
  const friends = transformedConnections.filter(conn => 
    conn.type === 'friend' && conn.relationship === 'friend'
  );

  // Fetch detailed pending connections that include both DB connections and gift-based invitations
  const fetchPendingConnections = async () => {
    if (!user) {
      console.log('❌ [useConnectionsAdapter] No user found');
      return;
    }
    
    setPendingLoading(true);
    try {
      console.log('🔍 [useConnectionsAdapter] Fetching pending connections for user:', user.id);

      // Get both incoming AND outgoing pending requests
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          *,
          requester_profile:profiles!user_connections_user_id_fkey(
            id,
            name,
            username,
            profile_image,
            bio
          ),
          recipient_profile:profiles!user_connections_connected_user_id_fkey(
            id,
            name,
            username,
            profile_image,
            bio
          )
        `)
        .or(`connected_user_id.eq.${user.id},user_id.eq.${user.id}`)
        .eq('status', 'pending');

      if (error) throw error;

      console.log('✅ [useConnectionsAdapter] Pending connections fetched:', data?.length || 0);

      const pendingFromDB = data?.map(conn => {
        // Determine if this is an incoming or outgoing request
        const isIncoming = conn.connected_user_id === user.id;
        
        if (isIncoming) {
          // Incoming request - show requester info
          return {
            id: conn.user_id,
            connectionId: conn.id,
            name: conn.requester_profile?.name || 'Unknown',
            username: conn.requester_profile?.username || '',
            imageUrl: conn.requester_profile?.profile_image || '',
            mutualFriends: 0,
            type: 'friend' as const,
            lastActive: 'recently',
            relationship: conn.relationship_type as RelationshipType,
            dataStatus: {
              shipping: 'missing' as const,
              birthday: 'missing' as const,
              email: 'missing' as const
            },
            bio: conn.requester_profile?.bio,
            isPending: true,
            isIncoming: true,
            connectionDate: conn.created_at
          };
        } else {
          // Outgoing request - show recipient info
          return {
            id: conn.connected_user_id,
            connectionId: conn.id,
            name: conn.recipient_profile?.name || 'Unknown',
            username: conn.recipient_profile?.username || '',
            imageUrl: conn.recipient_profile?.profile_image || '',
            mutualFriends: 0,
            type: 'friend' as const,
            lastActive: 'recently',
            relationship: conn.relationship_type as RelationshipType,
            dataStatus: {
              shipping: 'missing' as const,
              birthday: 'missing' as const,
              email: 'missing' as const
            },
            bio: conn.recipient_profile?.bio,
            isPending: true,
            isIncoming: false,
            connectionDate: conn.created_at
          };
        }
      }) || [];

      // Also get gift-based pending connections
      // NOTE: This functionality has been migrated to the unified service
      // For now, we'll skip gift-based pending connections until fully migrated
      const giftPendingData: any[] = []; // TODO: Implement in unified service
      const giftPending = giftPendingData.map(conn => ({
        id: conn.id,
        name: conn.pending_recipient_name || 'Unknown User',
        username: `@${conn.pending_recipient_email?.split('@')[0] || 'unknown'}`,
        imageUrl: '/placeholder.svg',
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
        bio: `Pending invitation sent to ${conn.pending_recipient_email}`,
        connectionDate: conn.created_at,
        isPending: true,
        recipientEmail: conn.pending_recipient_email
      }));

      const allPending = [...pendingFromDB, ...giftPending];
      console.log('🔗 [useConnectionsAdapter] Total pending connections:', allPending.length);
      setPendingConnections(allPending);
    } catch (error) {
      console.error('❌ [useConnectionsAdapter] Error fetching pending connections:', error);
      setPendingConnections([]);
    } finally {
      setPendingLoading(false);
    }
  };

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

  // Refresh all connection data
  const refreshAllConnections = async () => {
    console.log('🔄 [useConnectionsAdapter] Refreshing all connections');
    setRefreshTrigger(prev => prev + 1);
    await Promise.all([
      refetchConnections(),
      fetchPendingConnections(),
      fetchBidirectionalPermissions()
    ]);
  };

  // Set up real-time listeners for connection changes
  useEffect(() => {
    if (!user) return;

    console.log('🔗 [useConnectionsAdapter] Setting up real-time listeners');

    const channel = supabase
      .channel('connections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔗 [useConnectionsAdapter] Connection change detected (outgoing):', payload);
          refreshAllConnections();
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
          console.log('🔗 [useConnectionsAdapter] Connection change detected (incoming):', payload);
          refreshAllConnections();
        }
      )
      .subscribe();

    return () => {
      console.log('🔗 [useConnectionsAdapter] Cleaning up real-time listeners');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPendingConnections();
  }, [user, refreshTrigger]);

  return {
    connections: transformedConnections,
    friends,
    following: transformedFollowing,
    suggestions,
    pendingConnections,
    loading: loading || suggestionsLoading || pendingLoading,
    error,
    sendConnectionRequest,
    acceptConnectionRequest: async (requestId: string) => {
      const result = await acceptConnectionRequest(requestId);
      if (result) {
        // Trigger a refresh after successful acceptance
        await refreshAllConnections();
      }
      return result;
    },
    rejectConnectionRequest: async (requestId: string) => {
      const result = await rejectConnectionRequest(requestId);
      if (result) {
        // Trigger a refresh after successful rejection
        await refreshAllConnections();
      }
      return result;
    },
    removeConnection,
    handleRelationshipChange,
    handleSendVerificationRequest,
    filterConnections,
    calculateMutualFriends,
    refreshPendingConnections: refreshAllConnections
  };
};
