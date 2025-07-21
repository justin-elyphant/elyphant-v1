import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Connection, RelationshipType } from "@/types/connections";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

export const useConnectionsAdapter = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<Connection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return [];

      // Get connections where current user is either the requester OR the recipient
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
        .or(`user_id.eq.${currentUser.user.id},connected_user_id.eq.${currentUser.user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      return data?.map(conn => {
        // Determine which profile to show (the other person)
        const isCurrentUserRequester = conn.user_id === currentUser.user.id;
        
        if (isCurrentUserRequester) {
          // Current user sent the request, show recipient profile
          return {
            id: conn.connected_user_id,
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
            bio: conn.recipient_profile?.bio
          };
        } else {
          // Current user received the request, show requester profile
          return {
            id: conn.user_id,
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
            bio: conn.requester_profile?.bio
          };
        }
      }) || [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  };

  const fetchPendingConnections = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return [];

      console.log('🔍 [useConnectionsAdapter] Fetching pending connections for user:', currentUser.user.id);

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
        .or(`connected_user_id.eq.${currentUser.user.id},user_id.eq.${currentUser.user.id}`)
        .eq('status', 'pending');

      if (error) throw error;

      console.log('✅ [useConnectionsAdapter] Pending connections fetched:', data?.length || 0);

      return data?.map(conn => {
        // Determine if this is an incoming or outgoing request
        const isIncoming = conn.connected_user_id === currentUser.user.id;
        
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
    } catch (error) {
      console.error('❌ [useConnectionsAdapter] Error fetching pending connections:', error);
      return [];
    }
  };

  const fetchSuggestions = async () => {
    // For now, return empty array - suggestions would be a more complex feature
    return [];
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsData, pendingData, suggestionsData] = await Promise.all([
        fetchFriends(),
        fetchPendingConnections(),
        fetchSuggestions()
      ]);

      setFriends(friendsData);
      setPendingConnections(pendingData);
      setSuggestions(suggestionsData);
      setError(null);
    } catch (error) {
      console.error('Error loading connections data:', error);
      setError('Failed to load connections');
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time listener for connection changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('connections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `or(user_id.eq.${user.id},connected_user_id.eq.${user.id})`,
        },
        (payload) => {
          console.log('🔄 [useConnectionsAdapter] Connection change detected:', payload);
          // Reload data when any connection changes
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  const handleRelationshipChange = async (connectionId: string, newRelationship: RelationshipType) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { error } = await supabase
        .from('user_connections')
        .update({ relationship_type: newRelationship })
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${connectionId}),and(user_id.eq.${connectionId},connected_user_id.eq.${currentUser.user.id})`);

      if (error) throw error;

      toast.success('Relationship updated successfully');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast.error('Failed to update relationship');
    }
  };

  const handleSendVerificationRequest = async (connectionId: string) => {
    // This would be implemented based on your verification system
    toast.info('Verification request feature coming soon');
  };

  const filterConnections = (connections: Connection[], searchTerm: string) => {
    if (!searchTerm) return connections;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return connections.filter(conn => 
      conn.name.toLowerCase().includes(lowercaseSearch) ||
      conn.username.toLowerCase().includes(lowercaseSearch)
    );
  };

  const refreshPendingConnections = async () => {
    const pendingData = await fetchPendingConnections();
    setPendingConnections(pendingData);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    friends,
    suggestions,
    pendingConnections,
    connections: friends, // Backward compatibility
    following: [], // No longer used but some components may reference it
    loading,
    error,
    handleRelationshipChange,
    handleSendVerificationRequest,
    filterConnections,
    refreshPendingConnections,
    loadData
  };
};