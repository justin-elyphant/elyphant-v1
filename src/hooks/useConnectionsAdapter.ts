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

      console.log('🔍 [useConnectionsAdapter] Fetching friends for user:', currentUser.user.id);

      // First get the connections - use a simpler query without joins
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('id, user_id, connected_user_id, status, relationship_type, created_at')
        .or(`user_id.eq.${currentUser.user.id},connected_user_id.eq.${currentUser.user.id}`)
        .eq('status', 'accepted');

      if (connectionsError) throw connectionsError;

      console.log('✅ [useConnectionsAdapter] Found connections:', connections?.length || 0);

      if (!connections || connections.length === 0) {
        return [];
      }

      // Get all unique profile IDs we need to fetch
      const profileIds = new Set<string>();
      connections.forEach(conn => {
        profileIds.add(conn.user_id);
        profileIds.add(conn.connected_user_id);
      });

      // Remove current user ID as we don't need their own profile
      profileIds.delete(currentUser.user.id);

      // Fetch all profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username, profile_image, bio')
        .in('id', Array.from(profileIds));

      if (profilesError) throw profilesError;

      console.log('✅ [useConnectionsAdapter] Found profiles:', profiles?.length || 0);

      // Create a map for easy profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Transform connections to friend objects
      const friends = connections.map(conn => {
        // Determine which profile to show (the other person)
        const isCurrentUserRequester = conn.user_id === currentUser.user.id;
        const otherUserId = isCurrentUserRequester ? conn.connected_user_id : conn.user_id;
        const otherProfile = profileMap.get(otherUserId);
        
        console.log('🔍 [useConnectionsAdapter] Processing connection:', {
          connectionId: conn.id,
          isCurrentUserRequester,
          otherUserId,
          otherProfile: otherProfile ? { name: otherProfile.name, username: otherProfile.username } : 'Not found'
        });

        return {
          id: otherUserId,
          name: otherProfile?.name || 'Unknown',
          username: otherProfile?.username || '',
          imageUrl: otherProfile?.profile_image || '',
          mutualFriends: 0,
          type: 'friend' as const,
          lastActive: 'recently',
          relationship: conn.relationship_type as RelationshipType,
          dataStatus: {
            shipping: 'missing' as const,
            birthday: 'missing' as const,
            email: 'missing' as const
          },
          bio: otherProfile?.bio,
          connectionDate: conn.created_at
        };
      });

      console.log('✅ [useConnectionsAdapter] Final friends data:', friends.map(f => ({ name: f.name, username: f.username })));
      
      return friends;
    } catch (error) {
      console.error('❌ [useConnectionsAdapter] Error fetching friends:', error);
      return [];
    }
  };

  const fetchPendingConnections = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return [];

      console.log('🔍 [useConnectionsAdapter] Fetching pending connections for user:', currentUser.user.id);

      // First get the pending connections - use a simpler query without joins
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('id, user_id, connected_user_id, status, relationship_type, created_at')
        .or(`connected_user_id.eq.${currentUser.user.id},user_id.eq.${currentUser.user.id}`)
        .eq('status', 'pending');

      if (connectionsError) throw connectionsError;

      console.log('✅ [useConnectionsAdapter] Found pending connections:', connections?.length || 0);

      if (!connections || connections.length === 0) {
        return [];
      }

      // Get all unique profile IDs we need to fetch
      const profileIds = new Set<string>();
      connections.forEach(conn => {
        profileIds.add(conn.user_id);
        profileIds.add(conn.connected_user_id);
      });

      // Remove current user ID as we don't need their own profile
      profileIds.delete(currentUser.user.id);

      // Fetch all profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username, profile_image, bio')
        .in('id', Array.from(profileIds));

      if (profilesError) throw profilesError;

      // Create a map for easy profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Transform connections to pending connection objects
      return connections.map(conn => {
        // Determine if this is an incoming or outgoing request
        const isIncoming = conn.connected_user_id === currentUser.user.id;
        const otherUserId = isIncoming ? conn.user_id : conn.connected_user_id;
        const otherProfile = profileMap.get(otherUserId);
        
        return {
          id: otherUserId,
          connectionId: conn.id,
          name: otherProfile?.name || 'Unknown',
          username: otherProfile?.username || '',
          imageUrl: otherProfile?.profile_image || '',
          mutualFriends: 0,
          type: 'friend' as const,
          lastActive: 'recently',
          relationship: conn.relationship_type as RelationshipType,
          dataStatus: {
            shipping: 'missing' as const,
            birthday: 'missing' as const,
            email: 'missing' as const
          },
          bio: otherProfile?.bio,
          isPending: true,
          isIncoming,
          connectionDate: conn.created_at
        };
      });
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