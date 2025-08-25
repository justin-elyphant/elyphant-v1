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

      // First get the accepted connections - use simple query without problematic joins
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

      // Enhanced profile fetching with fallback strategy for accepted connections
      const profileData = await Promise.allSettled(
        Array.from(profileIds).map(async (profileId) => {
          try {
            // First try using can_view_profile RPC (should work now after fix)
            const { data: canView, error: rpcError } = await supabase
              .rpc('can_view_profile', { profile_user_id: profileId });

            if (rpcError) {
              console.warn('🚨 [useConnectionsAdapter] RPC error for profile', profileId, ':', rpcError);
              // Fallback: For accepted connections, always try to fetch profile data
              console.log('🔄 [useConnectionsAdapter] Using fallback for accepted connection:', profileId);
            }

            // Try to fetch profile data (should work for accepted connections)
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, username, profile_image, bio')
              .eq('id', profileId)
              .maybeSingle();

            if (profileError) {
              console.error('❌ [useConnectionsAdapter] Profile fetch error for', profileId, ':', profileError);
              throw profileError;
            }

            if (!profile) {
              console.warn('⚠️ [useConnectionsAdapter] No profile found for accepted connection:', profileId);
              // Return minimal profile data for accepted connections
              return {
                id: profileId,
                name: `Friend ${profileId.substring(0, 8)}`,
                username: `@friend${profileId.substring(0, 6)}`,
                profile_image: '/placeholder.svg',
                bio: ''
              };
            }

            console.log('✅ [useConnectionsAdapter] Successfully fetched profile for:', profile.name || profileId);
            return profile;

          } catch (error) {
            console.error('❌ [useConnectionsAdapter] Failed to fetch profile for', profileId, ':', error);
            // Always provide fallback for accepted connections
            return {
              id: profileId,
              name: `Friend ${profileId.substring(0, 8)}`,
              username: `@friend${profileId.substring(0, 6)}`,
              profile_image: '/placeholder.svg',
              bio: ''
            };
          }
        })
      );

      // Process results and create profile map
      const profileMap = new Map();
      profileData.forEach((result, index) => {
        const profileId = Array.from(profileIds)[index];
        if (result.status === 'fulfilled' && result.value) {
          profileMap.set(profileId, result.value);
        } else {
          console.error('❌ [useConnectionsAdapter] Failed to get profile for:', profileId);
          // Add fallback profile
          profileMap.set(profileId, {
            id: profileId,
            name: `Friend ${profileId.substring(0, 8)}`,
            username: `@friend${profileId.substring(0, 6)}`,
            profile_image: '/placeholder.svg',
            bio: ''
          });
        }
      });

      console.log('✅ [useConnectionsAdapter] Processed profiles:', profileMap.size);

      // Get all unique profile IDs for privacy settings lookup
      const friendProfileIds = connections.map(conn => {
        const isCurrentUserRequester = conn.user_id === currentUser.user.id;
        return isCurrentUserRequester ? conn.connected_user_id : conn.user_id;
      });

      // Fetch privacy settings AND connection permissions for all friends in batch
      const { data: privacyProfiles, error: privacyError } = await supabase
        .from('profiles')
        .select('id, data_sharing_settings, dob, email, shipping_address')
        .in('id', friendProfileIds);

      // Fetch connection-level permissions
      const { data: connectionPermissions, error: permError } = await supabase
        .from('user_connections')
        .select('user_id, connected_user_id, data_access_permissions')
        .or(`user_id.eq.${currentUser.user.id},connected_user_id.eq.${currentUser.user.id}`)
        .eq('status', 'accepted');

      if (privacyError) {
        console.error('❌ [useConnectionsAdapter] Privacy settings fetch error:', privacyError);
      }
      if (permError) {
        console.error('❌ [useConnectionsAdapter] Connection permissions fetch error:', permError);
      }

      // Create connection permissions map
      const permissionsMap = new Map();
      connectionPermissions?.forEach(conn => {
        const friendId = conn.user_id === currentUser.user.id ? conn.connected_user_id : conn.user_id;
        const permissions = conn.data_access_permissions || {};
        permissionsMap.set(friendId, permissions);
      });

      // Create privacy map with hierarchical checking (connection-level overrides global)
      const privacyMap = new Map();
      privacyProfiles?.forEach(profile => {
        const settings = profile.data_sharing_settings || {};
        const connectionPerms = permissionsMap.get(profile.id) || {};
        
        // Check if this friend is blocked from specific data types
        const isShippingBlocked = connectionPerms.shipping_address === false;
        const isBirthdayBlocked = connectionPerms.dob === false;
        const isEmailBlocked = connectionPerms.email === false;
        
        privacyMap.set(profile.id, {
          shipping: isShippingBlocked ? 'blocked' as const :
            (settings.shipping_address === 'friends' || settings.shipping_address === 'public') 
              ? (profile.shipping_address ? 'verified' as const : 'missing' as const)
              : 'missing' as const,
          birthday: isBirthdayBlocked ? 'blocked' as const :
            (settings.dob === 'friends' || settings.dob === 'public') 
              ? (profile.dob ? 'verified' as const : 'missing' as const)
              : 'missing' as const,
          email: isEmailBlocked ? 'blocked' as const :
            (settings.email === 'friends' || settings.email === 'public') 
              ? (profile.email ? 'verified' as const : 'missing' as const)
              : 'missing' as const,
          isBlocked: isShippingBlocked || isBirthdayBlocked || isEmailBlocked
        });
      });

      // Transform connections to friend objects with enhanced fallback
      const friends = connections.map(conn => {
        // Determine which profile to show (the other person)
        const isCurrentUserRequester = conn.user_id === currentUser.user.id;
        const otherUserId = isCurrentUserRequester ? conn.connected_user_id : conn.user_id;
        const otherProfile = profileMap.get(otherUserId);
        
        // Enhanced name resolution for accepted connections
        let displayName = otherProfile?.name || 'Unknown User';
        let displayUsername = otherProfile?.username || `@user${otherUserId?.substring(0, 6) || 'unknown'}`;
        
        // For accepted connections, we should always have some name
        if (displayName === 'Unknown User' || displayName.startsWith('Unknown')) {
          displayName = `Friend ${otherUserId?.substring(0, 8) || 'Unknown'}`;
          console.warn('⚠️ [useConnectionsAdapter] Using fallback name for accepted connection:', otherUserId);
        }
        
        // Get data status from privacy map or use fallback
        const dataStatus = privacyMap.get(otherUserId) || {
          shipping: 'missing' as const,
          birthday: 'missing' as const,
          email: 'missing' as const
        };

        console.log(`🔍 [useConnectionsAdapter] Privacy status for ${displayName}:`, dataStatus);

        return {
          id: otherUserId,
          connectionId: conn.id, // Add connectionId for deletion
          name: displayName,
          username: displayUsername,
          imageUrl: otherProfile?.profile_image || '/placeholder.svg',
          mutualFriends: 0,
          type: 'friend' as const,
          lastActive: 'recently',
          relationship: conn.relationship_type as RelationshipType,
          dataStatus,
          bio: otherProfile?.bio || '',
          connectionDate: conn.created_at
        };
      });
      
      console.log('✅ [useConnectionsAdapter] Transformed friends with enhanced fallback:', friends.length);
      console.log('🔍 [useConnectionsAdapter] Sample friend names:', friends.slice(0, 3).map(f => f.name));
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

      // Query 1: Get outgoing pending invitations (where user_id matches current user)
      const { data: outgoingInvitations, error: outgoingError } = await supabase
        .from('user_connections')
        .select('id, user_id, connected_user_id, status, relationship_type, created_at, pending_recipient_email, pending_recipient_name')
        .eq('user_id', currentUser.user.id)
        .in('status', ['pending', 'pending_invitation']);

      if (outgoingError) {
        console.error('❌ [useConnectionsAdapter] Error fetching outgoing invitations:', outgoingError);
        throw outgoingError;
      }

      // Query 2: Get incoming connection requests (where connected_user_id matches current user)
      const { data: incomingRequests, error: incomingError } = await supabase
        .from('user_connections')
        .select('id, user_id, connected_user_id, status, relationship_type, created_at, pending_recipient_email, pending_recipient_name')
        .eq('connected_user_id', currentUser.user.id)
        .eq('status', 'pending');

      if (incomingError) {
        console.error('❌ [useConnectionsAdapter] Error fetching incoming requests:', incomingError);
        throw incomingError;
      }

      // Combine both results
      const connections = [...(outgoingInvitations || []), ...(incomingRequests || [])];

      console.log('✅ [useConnectionsAdapter] Found outgoing invitations:', outgoingInvitations?.length || 0);
      console.log('✅ [useConnectionsAdapter] Found incoming requests:', incomingRequests?.length || 0);
      console.log('✅ [useConnectionsAdapter] Total pending connections:', connections.length);
      console.log('🔍 [useConnectionsAdapter] Raw connections data:', connections);

      if (!connections || connections.length === 0) {
        return [];
      }

      // Get all unique profile IDs we need to fetch (only for connections with actual connected_user_id)
      const profileIds = new Set<string>();
      connections.forEach(conn => {
        if (conn.user_id) profileIds.add(conn.user_id);
        if (conn.connected_user_id) profileIds.add(conn.connected_user_id);
      });

      // Remove current user ID as we don't need their own profile
      profileIds.delete(currentUser.user.id);

      // Fetch profiles only for existing users (not pending invitations)
      let profileMap = new Map();
      if (profileIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, username, profile_image, bio')
          .in('id', Array.from(profileIds));

        if (profilesError) throw profilesError;

        // Create a map for easy profile lookup
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Transform connections to pending connection objects
      const transformedConnections = connections.map((conn, index) => {
        console.log(`🔍 [useConnectionsAdapter] Processing connection ${index + 1}:`, {
          id: conn.id,
          status: conn.status,
          user_id: conn.user_id,
          connected_user_id: conn.connected_user_id,
          pending_recipient_name: conn.pending_recipient_name,
          pending_recipient_email: conn.pending_recipient_email
        });

        // Handle pending invitations vs actual connection requests differently
        if (conn.status === 'pending_invitation' && !conn.connected_user_id) {
          // This is a pending invitation (like Heather) - use pending_recipient_* fields
          const transformedConnection = {
            id: `pending_${conn.id}`, // Use unique ID for pending invitations
            connectionId: conn.id,
            name: conn.pending_recipient_name || 'Unknown Recipient',
            username: conn.pending_recipient_email ? `@${conn.pending_recipient_email.split('@')[0]}` : '@unknown',
            imageUrl: '/placeholder.svg',
            mutualFriends: 0,
            type: 'friend' as const,
            lastActive: 'recently',
            relationship: conn.relationship_type as RelationshipType,
            dataStatus: {
              shipping: 'missing' as const,
              birthday: 'missing' as const,
              email: 'missing' as const
            },
            bio: '',
            isPending: true,
            isIncoming: false, // These are outgoing invitations
            connectionDate: conn.created_at,
            recipientEmail: conn.pending_recipient_email,
            status: conn.status
          };
          
          console.log(`🎯 [useConnectionsAdapter] ✅ FIXED: Transformed pending invitation for ${conn.pending_recipient_name}:`, transformedConnection);
          return transformedConnection;
        } else {
          // This is a regular connection request with actual user profiles
          const isIncoming = conn.connected_user_id === currentUser.user.id;
          const otherUserId = isIncoming ? conn.user_id : conn.connected_user_id;
          const otherProfile = profileMap.get(otherUserId);
          
          const transformedConnection = {
            id: otherUserId,
            connectionId: conn.id,
            name: otherProfile?.name || 'Unknown',
            username: otherProfile?.username || '',
            imageUrl: otherProfile?.profile_image || '/placeholder.svg',
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
            connectionDate: conn.created_at,
            recipientEmail: conn.pending_recipient_email,
            status: conn.status
          };
          
          console.log(`✅ [useConnectionsAdapter] Transformed connection request:`, transformedConnection);
          return transformedConnection;
        }
      });

      console.log('🎯 [useConnectionsAdapter] Final transformed pending connections:', transformedConnections);
      return transformedConnections;
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

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return false;

      const { error } = await supabase
        .from('user_connections')
        .delete()
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${connectionId}),and(user_id.eq.${connectionId},connected_user_id.eq.${currentUser.user.id})`);

      if (error) throw error;

      toast.success('Connection removed successfully');
      loadData(); // Refresh data
      return true;
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Failed to remove connection');
      return false;
    }
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
    handleDeleteConnection,
    filterConnections,
    refreshPendingConnections,
    loadData
  };
};