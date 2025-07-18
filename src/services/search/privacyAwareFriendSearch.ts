
import { supabase } from "@/integrations/supabase/client";
import { FriendSearchResult } from "./friendSearchService";

export interface PrivacySettings {
  profile_visibility: 'public' | 'followers_only' | 'private';
  allow_follows_from: 'everyone' | 'friends_only' | 'nobody';
  show_follower_count: boolean;
  show_following_count: boolean;
  allow_message_requests: boolean;
}

export interface FilteredProfile {
  id: string;
  name: string;
  username: string;
  email?: string; // Only shown based on privacy settings
  profile_image?: string;
  bio?: string;
  connectionStatus: FriendSearchResult['connectionStatus'];
  mutualConnections?: number;
  lastActive?: string;
  isPrivacyRestricted?: boolean;
  privacyLevel?: 'public' | 'limited' | 'private';
}

export const getPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching privacy settings:', error);
      return null;
    }

    // Return default settings if none found
    return data || {
      profile_visibility: 'public',
      allow_follows_from: 'everyone',
      show_follower_count: true,
      show_following_count: true,
      allow_message_requests: true
    };
  } catch (error) {
    console.error('Error in getPrivacySettings:', error);
    return null;
  }
};

export const canContactUser = async (targetUserId: string, currentUserId?: string): Promise<boolean> => {
  if (!currentUserId) return false;
  
  try {
    // Check if users are blocked
    const { data: blockedData } = await supabase
      .rpc('is_user_blocked', { user1_id: currentUserId, user2_id: targetUserId });
    
    if (blockedData) return false;

    // Get target user's privacy settings
    const privacySettings = await getPrivacySettings(targetUserId);
    if (!privacySettings) return false;

    // Check follow permissions
    switch (privacySettings.allow_follows_from) {
      case 'nobody':
        return false;
      case 'friends_only':
        // Check if already connected
        const { data: connectionData } = await supabase
          .rpc('are_users_connected', { user_id_1: currentUserId, user_id_2: targetUserId });
        return connectionData || false;
      case 'everyone':
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking contact permissions:', error);
    return false;
  }
};

export const searchFriendsWithPrivacy = async (
  query: string, 
  currentUserId?: string
): Promise<FilteredProfile[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    console.log(`Privacy-aware search for: "${query}"`);
    
    // Search profiles with basic info
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, username, email, profile_image, bio')
      .or(`name.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .limit(20);

    if (error) {
      console.error('Error in privacy-aware search:', error);
      return [];
    }

    if (!profiles || profiles.length === 0) return [];

    // Filter profiles based on privacy settings
    const filteredResults: FilteredProfile[] = [];

    for (const profile of profiles) {
      // Skip current user
      if (profile.id === currentUserId) continue;

      // Get privacy settings for this profile
      const privacySettings = await getPrivacySettings(profile.id);
      if (!privacySettings) continue;

      // Check if profile should be visible based on privacy settings
      const canViewProfile = await canViewProfile(profile.id, currentUserId, privacySettings);
      if (!canViewProfile) continue;

      // Get connection status if user is authenticated
      let connectionStatus: FriendSearchResult['connectionStatus'] = 'none';
      if (currentUserId) {
        const { data: connections } = await supabase
          .from('user_connections')
          .select('status')
          .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${profile.id}),and(user_id.eq.${profile.id},connected_user_id.eq.${currentUserId})`)
          .single();

        if (connections) {
          connectionStatus = connections.status === 'accepted' ? 'connected' : 'pending';
        }
      }

      // Filter information based on privacy level and authentication
      const filteredProfile = await filterProfileInfo(
        profile, 
        privacySettings, 
        currentUserId, 
        connectionStatus
      );

      filteredResults.push(filteredProfile);
    }

    console.log(`Privacy-aware search returned ${filteredResults.length} results`);
    return filteredResults;

  } catch (error) {
    console.error('Error in searchFriendsWithPrivacy:', error);
    return [];
  }
};

const canViewProfile = async (
  targetUserId: string, 
  currentUserId: string | undefined, 
  privacySettings: PrivacySettings
): Promise<boolean> => {
  // Public profiles are always visible
  if (privacySettings.profile_visibility === 'public') return true;

  // Private profiles require authentication
  if (!currentUserId) return false;

  // Check if users are blocked
  const { data: blockedData } = await supabase
    .rpc('is_user_blocked', { user1_id: currentUserId, user2_id: targetUserId });
  
  if (blockedData) return false;

  // For followers_only and private, check connection status
  if (privacySettings.profile_visibility === 'followers_only' || 
      privacySettings.profile_visibility === 'private') {
    const { data: connectionData } = await supabase
      .rpc('are_users_connected', { user_id_1: currentUserId, user_id_2: targetUserId });
    
    return connectionData || false;
  }

  return true;
};

const filterProfileInfo = async (
  profile: any,
  privacySettings: PrivacySettings,
  currentUserId: string | undefined,
  connectionStatus: FriendSearchResult['connectionStatus']
): Promise<FilteredProfile> => {
  const isAuthenticated = !!currentUserId;
  const isConnected = connectionStatus === 'connected';
  const isPublicProfile = privacySettings.profile_visibility === 'public';

  // Determine privacy level for UI display
  let privacyLevel: 'public' | 'limited' | 'private' = 'public';
  if (privacySettings.profile_visibility === 'private') {
    privacyLevel = 'private';
  } else if (privacySettings.profile_visibility === 'followers_only') {
    privacyLevel = 'limited';
  }

  // Base profile info always shown
  const filteredProfile: FilteredProfile = {
    id: profile.id,
    name: profile.name || 'Unknown User',
    username: profile.username || '',
    profile_image: profile.profile_image,
    connectionStatus,
    privacyLevel,
    isPrivacyRestricted: !isPublicProfile
  };

  // Email visibility rules
  if (isAuthenticated && (isPublicProfile || isConnected)) {
    filteredProfile.email = profile.email;
  }

  // Bio visibility rules
  if (isPublicProfile || (isAuthenticated && isConnected)) {
    filteredProfile.bio = profile.bio;
  }

  // Additional info for connected users
  if (isAuthenticated && isConnected) {
    filteredProfile.mutualConnections = 0; // TODO: Calculate mutual connections
    filteredProfile.lastActive = 'Recently'; // TODO: Get actual last active time
  }

  return filteredProfile;
};

export const getConnectionPermissions = async (
  targetUserId: string, 
  currentUserId?: string
): Promise<{
  canSendRequest: boolean;
  canViewProfile: boolean;
  canMessage: boolean;
  restrictionReason?: string;
}> => {
  if (!currentUserId) {
    return {
      canSendRequest: false,
      canViewProfile: false,
      canMessage: false,
      restrictionReason: 'Authentication required'
    };
  }

  try {
    // Check if blocked
    const { data: blockedData } = await supabase
      .rpc('is_user_blocked', { user1_id: currentUserId, user2_id: targetUserId });
    
    if (blockedData) {
      return {
        canSendRequest: false,
        canViewProfile: false,
        canMessage: false,
        restrictionReason: 'User is blocked'
      };
    }

    // Get privacy settings
    const privacySettings = await getPrivacySettings(targetUserId);
    if (!privacySettings) {
      return {
        canSendRequest: false,
        canViewProfile: false,
        canMessage: false,
        restrictionReason: 'Privacy settings unavailable'
      };
    }

    // Check connection permissions
    const canSendRequest = await canContactUser(targetUserId, currentUserId);
    const canViewProfile = await canViewProfile(targetUserId, currentUserId, privacySettings);
    const canMessage = privacySettings.allow_message_requests && canSendRequest;

    let restrictionReason: string | undefined;
    if (!canSendRequest) {
      if (privacySettings.allow_follows_from === 'nobody') {
        restrictionReason = 'User does not accept connection requests';
      } else if (privacySettings.allow_follows_from === 'friends_only') {
        restrictionReason = 'User only accepts requests from friends';
      }
    }

    return {
      canSendRequest,
      canViewProfile,
      canMessage,
      restrictionReason
    };

  } catch (error) {
    console.error('Error getting connection permissions:', error);
    return {
      canSendRequest: false,
      canViewProfile: false,
      canMessage: false,
      restrictionReason: 'Error checking permissions'
    };
  }
};
