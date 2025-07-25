
import { useMemo, useState, useEffect } from "react";
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

  // Transform enhanced connections into UI-compatible format
  const transformedConnections = useMemo(() => {
    console.log('🔄 [useConnectionsAdapter] Transforming connections:', connections.length);
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
  }, [connections, refreshTrigger]);

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
      fetchPendingConnections()
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
