
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PrivacySettings = Database['public']['Tables']['privacy_settings']['Row'];

export interface FilteredProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  profile_image?: string;
  bio?: string;
  connectionStatus: 'connected' | 'pending' | 'none' | 'blocked';
  mutualConnections?: number;
  lastActive?: string;
  privacyLevel?: 'public' | 'limited' | 'private';
  isPrivacyRestricted?: boolean;
}

export interface PrivacyAwareFriendSearchResult {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
  bio?: string;
  can_connect: boolean;
  connection_policy: string;
}

export const searchFriendsWithPrivacy = async (
  searchTerm: string,
  currentUserId?: string,
  limit: number = 20
): Promise<FilteredProfile[]> => {
  try {
    // Clean the search term - remove @ symbol if searching for username
    const cleanedSearchTerm = searchTerm.startsWith('@') ? searchTerm.slice(1) : searchTerm;
    
    console.log(`🔍 Searching for profiles with term: "${searchTerm}" (cleaned: "${cleanedSearchTerm}")`);
    
    // Search for profiles matching the search term across multiple fields
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        username,
        first_name,
        last_name,
        email,
        profile_image,
        bio
      `)
      .or(`name.ilike.%${cleanedSearchTerm}%,username.ilike.%${cleanedSearchTerm}%,first_name.ilike.%${cleanedSearchTerm}%,last_name.ilike.%${cleanedSearchTerm}%,email.ilike.%${cleanedSearchTerm}%`)
      .limit(limit);

    if (profileError) throw profileError;

    console.log(`🔍 Raw search results: ${profiles?.length || 0} profiles found`);
    console.log(`🔍 Profile results:`, profiles);

    if (!profiles || profiles.length === 0) {
      console.log(`🔍 No profiles found for search term: "${cleanedSearchTerm}"`);
      return [];
    }

    console.log(`🔍 Processing ${profiles.length} profiles through privacy filter...`);

    // Get privacy settings for found profiles
    const profileIds = profiles.map(p => p.id);
    const { data: privacySettings, error: privacyError } = await supabase
      .from('privacy_settings')
      .select('user_id, allow_connection_requests_from')
      .in('user_id', profileIds);

    if (privacyError) throw privacyError;

    // Get existing connections to filter out already connected users
    const { data: existingConnections, error: connectionError } = await supabase
      .from('user_connections')
      .select('user_id, connected_user_id')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.in.(${profileIds.join(',')})),and(user_id.in.(${profileIds.join(',')}),connected_user_id.eq.${currentUserId})`);

    if (connectionError) throw connectionError;

    // Get blocked users
    const { data: blockedUsers, error: blockError } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.in.(${profileIds.join(',')})),and(blocker_id.in.(${profileIds.join(',')}),blocked_id.eq.${currentUserId})`);

    if (blockError) throw blockError;

    // Create sets for quick lookup
    const connectedUserIds = new Set(
      existingConnections?.flatMap(conn => [
        conn.user_id === currentUserId ? conn.connected_user_id : conn.user_id
      ]) || []
    );

    const blockedUserIds = new Set(
      blockedUsers?.flatMap(block => [
        block.blocker_id === currentUserId ? block.blocked_id : block.blocker_id
      ]) || []
    );

    // Check connection status for each profile
    const connectionStatusPromises = profiles.map(async (profile) => {
      const { data: connectionData } = await supabase
        .from('user_connections')
        .select('status')
        .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${profile.id}),and(user_id.eq.${profile.id},connected_user_id.eq.${currentUserId})`)
        .single();

      return {
        profileId: profile.id,
        status: connectionData ? (connectionData.status === 'accepted' ? 'connected' : 'pending') : 'none'
      };
    });

    const connectionStatuses = await Promise.all(connectionStatusPromises);
    const statusMap = new Map(connectionStatuses.map(cs => [cs.profileId, cs.status]));

    // Process results
    console.log(`🔍 Connected user IDs:`, Array.from(connectedUserIds));
    console.log(`🔍 Blocked user IDs:`, Array.from(blockedUserIds));
    
    const filteredProfiles = profiles.filter(profile => {
      const isBlocked = blockedUserIds.has(profile.id);
      console.log(`🔍 Profile ${profile.id} (${profile.name}): blocked=${isBlocked}`);
      // Only filter out blocked users for now
      return !isBlocked;
    });
    
    console.log(`🔍 After filtering: ${filteredProfiles.length} profiles remain`);
    
    const results: FilteredProfile[] = filteredProfiles
      .map(profile => {
        const userPrivacy = privacySettings?.find(ps => ps.user_id === profile.id);
        const connectionPolicy = userPrivacy?.allow_connection_requests_from || 'everyone';
        
        // Determine if current user can connect based on privacy settings
        let canConnect = true;
        if (connectionPolicy === 'nobody') {
          canConnect = false;
        } else if (connectionPolicy === 'friends_only') {
          // For friends_only, they would need to be already connected, which we filtered out above
          canConnect = false;
        }

        const connectionStatus = statusMap.get(profile.id) || 'none';
        const privacyLevel = connectionPolicy === 'nobody' ? 'private' : 
                           connectionPolicy === 'friends_only' ? 'limited' : 'public';

        return {
          id: profile.id,
          name: profile.name || 'Unknown User',
          username: profile.username || '',
          email: '', // Email not included for privacy
          profile_image: profile.profile_image || undefined,
          bio: profile.bio || undefined,
          connectionStatus: connectionStatus as 'connected' | 'pending' | 'none' | 'blocked',
          mutualConnections: 0, // TODO: Implement mutual connections count
          privacyLevel: privacyLevel as 'public' | 'limited' | 'private',
          isPrivacyRestricted: !canConnect
        };
      });

    return results;
  } catch (error) {
    console.error('Error in privacy-aware friend search:', error);
    return [];
  }
};

export const privacyAwareFriendSearch = async (
  searchTerm: string,
  currentUserId: string,
  limit: number = 20
): Promise<PrivacyAwareFriendSearchResult[]> => {
  const results = await searchFriendsWithPrivacy(searchTerm, currentUserId, limit);
  return results.map(profile => ({
    id: profile.id,
    name: profile.name,
    username: profile.username,
    profile_image: profile.profile_image,
    bio: profile.bio,
    can_connect: !profile.isPrivacyRestricted,
    connection_policy: profile.privacyLevel === 'private' ? 'nobody' : 
                      profile.privacyLevel === 'limited' ? 'friends_only' : 'everyone'
  }));
};

export const getConnectionPermissions = async (targetUserId: string, currentUserId?: string) => {
  if (!currentUserId) {
    return {
      canSendRequest: false,
      canViewProfile: true,
      canMessage: false,
      restrictionReason: 'You must be logged in to send connection requests'
    };
  }

  try {
    // Get target user's privacy settings
    const { data: privacySettings } = await supabase
      .from('privacy_settings')
      .select('allow_connection_requests_from')
      .eq('user_id', targetUserId)
      .single();

    const connectionPolicy = privacySettings?.allow_connection_requests_from || 'everyone';

    // Check if users are already connected
    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`)
      .single();

    if (existingConnection) {
      return {
        canSendRequest: false,
        canViewProfile: true,
        canMessage: existingConnection.status === 'accepted',
        restrictionReason: existingConnection.status === 'accepted' ? 'Already connected' : 'Connection request pending'
      };
    }

    // Check if blocked
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`)
      .single();

    if (blocked) {
      return {
        canSendRequest: false,
        canViewProfile: false,
        canMessage: false,
        restrictionReason: 'User is blocked'
      };
    }

    // Apply privacy policy
    let canSendRequest = true;
    let restrictionReason = undefined;

    if (connectionPolicy === 'nobody') {
      canSendRequest = false;
      restrictionReason = 'User does not accept connection requests';
    } else if (connectionPolicy === 'friends_only') {
      canSendRequest = false;
      restrictionReason = 'User only accepts requests from existing connections';
    }

    return {
      canSendRequest,
      canViewProfile: true,
      canMessage: false,
      restrictionReason
    };

  } catch (error) {
    console.error('Error checking connection permissions:', error);
    return {
      canSendRequest: false,
      canViewProfile: true,
      canMessage: false,
      restrictionReason: 'Unable to verify permissions'
    };
  }
};
