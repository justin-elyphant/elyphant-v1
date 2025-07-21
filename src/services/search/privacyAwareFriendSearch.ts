
import { supabase } from "@/integrations/supabase/client";

export interface FilteredProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  profile_image?: string;
  bio?: string;
  connectionStatus: 'connected' | 'pending' | 'none' | 'blocked';
  mutualConnections?: number;
  lastActive?: string;
  privacyLevel?: 'public' | 'limited' | 'private';
  isPrivacyRestricted?: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'followers_only' | 'private';
  allow_follows_from: 'everyone' | 'friends_only' | 'nobody';
  show_follower_count: boolean;
  show_following_count: boolean;
  allow_message_requests: boolean;
}

const getDefaultPrivacySettings = (): PrivacySettings => ({
  profile_visibility: 'public',
  allow_follows_from: 'everyone', 
  show_follower_count: true,
  show_following_count: true,
  allow_message_requests: true
});

export const searchFriendsWithPrivacy = async (
  query: string, 
  currentUserId?: string
): Promise<FilteredProfile[]> => {
  console.log('🔍 [searchFriendsWithPrivacy] Starting search:', { query, currentUserId });
  
  if (!query || query.length < 2) {
    console.log('🔍 [searchFriendsWithPrivacy] Query too short, returning empty results');
    return [];
  }

  try {
    // Search profiles by name or username
    console.log('🔍 [searchFriendsWithPrivacy] Executing database query...');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, username, email, profile_image, bio, created_at')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('🔍 [searchFriendsWithPrivacy] Database error:', error);
      return [];
    }

    console.log('🔍 [searchFriendsWithPrivacy] Raw profiles found:', profiles?.length || 0);
    console.log('🔍 [searchFriendsWithPrivacy] Profile details:', profiles?.map(p => ({ id: p.id, name: p.name, username: p.username })));

    if (!profiles || profiles.length === 0) {
      console.log('🔍 [searchFriendsWithPrivacy] No profiles found in database');
      return [];
    }

    // Get privacy settings for all found profiles
    console.log('🔍 [searchFriendsWithPrivacy] Fetching privacy settings...');
    const profileIds = profiles.map(p => p.id);
    const { data: privacyData, error: privacyError } = await supabase
      .from('privacy_settings')
      .select('user_id, profile_visibility, allow_follows_from, show_follower_count, show_following_count, allow_message_requests')
      .in('user_id', profileIds);

    if (privacyError) {
      console.error('🔍 [searchFriendsWithPrivacy] Privacy settings error:', privacyError);
    }

    console.log('🔍 [searchFriendsWithPrivacy] Privacy settings found:', privacyData?.length || 0);

    // Create privacy settings map with defaults
    const privacyMap = new Map<string, PrivacySettings>();
    profileIds.forEach(id => {
      const defaultSettings = getDefaultPrivacySettings();
      privacyMap.set(id, defaultSettings);
      console.log(`🔍 [searchFriendsWithPrivacy] Set default privacy for ${id}:`, defaultSettings);
    });

    // Override with actual privacy settings where available
    privacyData?.forEach(setting => {
      const privacySettings: PrivacySettings = {
        profile_visibility: setting.profile_visibility || 'public',
        allow_follows_from: setting.allow_follows_from || 'everyone',
        show_follower_count: setting.show_follower_count ?? true,
        show_following_count: setting.show_following_count ?? true,
        allow_message_requests: setting.allow_message_requests ?? true
      };
      privacyMap.set(setting.user_id, privacySettings);
      console.log(`🔍 [searchFriendsWithPrivacy] Updated privacy for ${setting.user_id}:`, privacySettings);
    });

    // Get connection statuses if user is authenticated
    let connectionMap = new Map<string, string>();
    if (currentUserId) {
      console.log('🔍 [searchFriendsWithPrivacy] Fetching connection statuses...');
      const { data: connections, error: connectionError } = await supabase
        .from('user_connections')
        .select('connected_user_id, user_id, status')
        .or(`and(user_id.eq.${currentUserId},connected_user_id.in.(${profileIds.join(',')})),and(connected_user_id.eq.${currentUserId},user_id.in.(${profileIds.join(',')}))`);

      if (connectionError) {
        console.error('🔍 [searchFriendsWithPrivacy] Connection status error:', connectionError);
      }

      connections?.forEach(conn => {
        const targetUserId = conn.user_id === currentUserId ? conn.connected_user_id : conn.user_id;
        const status = conn.status === 'accepted' ? 'connected' : 'pending';
        connectionMap.set(targetUserId, status);
      });

      console.log('🔍 [searchFriendsWithPrivacy] Connection statuses:', Object.fromEntries(connectionMap));
    }

    // Filter and transform profiles
    const filteredProfiles: FilteredProfile[] = [];
    
    for (const profile of profiles) {
      const privacy = privacyMap.get(profile.id);
      const connectionStatus = connectionMap.get(profile.id) || 'none';
      
      console.log(`🔍 [searchFriendsWithPrivacy] Processing profile ${profile.username}:`, {
        privacy: privacy?.profile_visibility,
        connectionStatus,
        isCurrentUser: profile.id === currentUserId
      });

      // Skip current user from results
      if (profile.id === currentUserId) {
        console.log(`🔍 [searchFriendsWithPrivacy] Skipping current user: ${profile.username}`);
        continue;
      }

      // Apply privacy filtering
      let canView = false;
      
      if (privacy?.profile_visibility === 'public') {
        canView = true;
        console.log(`🔍 [searchFriendsWithPrivacy] ${profile.username} is public - can view`);
      } else if (privacy?.profile_visibility === 'followers_only' && connectionStatus === 'connected') {
        canView = true;
        console.log(`🔍 [searchFriendsWithPrivacy] ${profile.username} is followers_only and user is connected - can view`);
      } else if (privacy?.profile_visibility === 'private') {
        canView = false;
        console.log(`🔍 [searchFriendsWithPrivacy] ${profile.username} is private - cannot view`);
      } else {
        console.log(`🔍 [searchFriendsWithPrivacy] ${profile.username} privacy check failed:`, {
          visibility: privacy?.profile_visibility,
          connectionStatus
        });
      }

      if (canView) {
        const filteredProfile: FilteredProfile = {
          id: profile.id,
          name: profile.name || 'Unknown User',
          username: profile.username || '@unknown',
          email: profile.email,
          profile_image: profile.profile_image,
          bio: profile.bio,
          connectionStatus: connectionStatus as any,
          privacyLevel: privacy?.profile_visibility === 'public' ? 'public' : 'limited',
          isPrivacyRestricted: privacy?.profile_visibility !== 'public'
        };

        filteredProfiles.push(filteredProfile);
        console.log(`🔍 [searchFriendsWithPrivacy] Added ${profile.username} to results`);
      } else {
        console.log(`🔍 [searchFriendsWithPrivacy] Filtered out ${profile.username} due to privacy settings`);
      }
    }

    console.log(`🔍 [searchFriendsWithPrivacy] Final results: ${filteredProfiles.length} profiles`);
    console.log('🔍 [searchFriendsWithPrivacy] Result usernames:', filteredProfiles.map(p => p.username));
    
    return filteredProfiles;

  } catch (error) {
    console.error('🔍 [searchFriendsWithPrivacy] Unexpected error:', error);
    return [];
  }
};

export const getConnectionPermissions = async (
  targetUserId: string, 
  currentUserId?: string
) => {
  if (!currentUserId) {
    return {
      canSendRequest: false,
      restrictionReason: "You must be logged in to send connection requests"
    };
  }

  if (targetUserId === currentUserId) {
    return {
      canSendRequest: false,
      restrictionReason: "You cannot connect with yourself"
    };
  }

  try {
    // Check if there's already a connection
    const { data: existingConnection, error } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking existing connection:', error);
      return {
        canSendRequest: false,
        restrictionReason: "Unable to verify connection status"
      };
    }

    if (existingConnection) {
      return {
        canSendRequest: false,
        restrictionReason: existingConnection.status === 'accepted' 
          ? "Already connected" 
          : "Connection request already sent"
      };
    }

    // Check target user's privacy settings
    const { data: privacy, error: privacyError } = await supabase
      .from('privacy_settings')
      .select('allow_follows_from')
      .eq('user_id', targetUserId)
      .single();

    if (privacyError && privacyError.code !== 'PGRST116') {
      console.error('Error checking privacy settings:', error);
    }

    const allowFollowsFrom = privacy?.allow_follows_from || 'everyone';

    if (allowFollowsFrom === 'nobody') {
      return {
        canSendRequest: false,
        restrictionReason: "This user doesn't accept connection requests"
      };
    }

    return {
      canSendRequest: true,
      restrictionReason: null
    };

  } catch (error) {
    console.error('Error checking connection permissions:', error);
    return {
      canSendRequest: false,
      restrictionReason: "Unable to check connection permissions"
    };
  }
};
