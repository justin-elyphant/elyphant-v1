
import { supabase } from "@/integrations/supabase/client";
import { checkConnectionStatus } from "./friendSearchService";

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
  allow_follows_from: 'everyone' | 'friends_only' | 'nobody';
  profile_visibility: 'public' | 'followers_only' | 'private';
  show_follower_count: boolean;
  show_following_count: boolean;
}

const getDefaultPrivacySettings = (): PrivacySettings => ({
  allow_follows_from: 'everyone',
  profile_visibility: 'public',
  show_follower_count: true,
  show_following_count: true
});

const getPrivacySettings = async (userId: string): Promise<PrivacySettings> => {
  try {
    console.log(`Getting privacy settings for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('allow_follows_from, profile_visibility, show_follower_count, show_following_count')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`Error fetching privacy settings for ${userId}:`, error);
      // Return default settings on error
      return getDefaultPrivacySettings();
    }

    if (!data) {
      console.log(`No privacy settings found for ${userId}, using defaults (public)`);
      return getDefaultPrivacySettings();
    }

    console.log(`Privacy settings for ${userId}:`, data);
    return data as PrivacySettings;
  } catch (error) {
    console.error(`Exception getting privacy settings for ${userId}:`, error);
    // Always return default settings on any error
    return getDefaultPrivacySettings();
  }
};

export const searchFriendsWithPrivacy = async (
  query: string, 
  currentUserId?: string
): Promise<FilteredProfile[]> => {
  console.log(`Privacy-aware friend search: "${query}" by user: ${currentUserId || 'unauthenticated'}`);
  
  if (!query || query.length < 2) return [];

  try {
    // Build the search query
    let searchQuery = supabase
      .from('profiles')
      .select('id, name, username, email, profile_image, bio, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    // Apply search filters
    const searchTerm = `%${query.toLowerCase()}%`;
    searchQuery = searchQuery.or(
      `name.ilike.${searchTerm},username.ilike.${searchTerm},email.ilike.${searchTerm}`
    );

    const { data: profiles, error } = await searchQuery;

    if (error) {
      console.error('Database search error:', error);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found in database search');
      return [];
    }

    console.log(`Found ${profiles.length} profiles from database search`);

    // Process each profile with privacy filtering
    const processedProfiles: FilteredProfile[] = [];

    for (const profile of profiles) {
      try {
        // Skip the current user's own profile
        if (currentUserId && profile.id === currentUserId) {
          continue;
        }

        // Get privacy settings with guaranteed fallback to defaults
        const privacySettings = await getPrivacySettings(profile.id);
        
        // For unauthenticated users, only show public profiles
        if (!currentUserId) {
          if (privacySettings.profile_visibility === 'public') {
            console.log(`Including public profile for unauthenticated user: ${profile.username}`);
            
            processedProfiles.push({
              id: profile.id,
              name: profile.name || 'Unknown User',
              username: profile.username || 'unknown',
              email: profile.email,
              profile_image: profile.profile_image,
              bio: profile.bio,
              connectionStatus: 'none',
              privacyLevel: 'public',
              isPrivacyRestricted: false
            });
          } else {
            console.log(`Excluding non-public profile for unauthenticated user: ${profile.username}`);
          }
          continue;
        }

        // For authenticated users, apply full privacy logic
        let canView = false;
        let privacyLevel: 'public' | 'limited' | 'private' = 'private';

        if (privacySettings.profile_visibility === 'public') {
          canView = true;
          privacyLevel = 'public';
        } else if (privacySettings.profile_visibility === 'followers_only') {
          // Check if they're connected
          const connectionStatus = await checkConnectionStatus(currentUserId, profile.id);
          canView = connectionStatus === 'connected';
          privacyLevel = 'limited';
        } else {
          // Private profile
          canView = false;
          privacyLevel = 'private';
        }

        if (canView) {
          const connectionStatus = await checkConnectionStatus(currentUserId, profile.id);
          
          console.log(`Including profile for authenticated user: ${profile.username}`);
          
          processedProfiles.push({
            id: profile.id,
            name: profile.name || 'Unknown User',
            username: profile.username || 'unknown',
            email: profile.email,
            profile_image: profile.profile_image,
            bio: profile.bio,
            connectionStatus,
            privacyLevel,
            isPrivacyRestricted: privacyLevel !== 'public'
          });
        } else {
          console.log(`Excluding private profile: ${profile.username}`);
        }

      } catch (profileError) {
        console.error(`Error processing profile ${profile.id}:`, profileError);
        // Continue processing other profiles
      }
    }

    console.log(`Privacy filtering result: ${processedProfiles.length} profiles accessible`);
    return processedProfiles;

  } catch (error) {
    console.error('Privacy-aware friend search error:', error);
    return [];
  }
};

export const getConnectionPermissions = async (
  targetUserId: string,
  requestingUserId?: string
) => {
  try {
    const privacySettings = await getPrivacySettings(targetUserId);
    
    // Default permissions for public profiles
    if (privacySettings.allow_follows_from === 'everyone') {
      return {
        canSendRequest: true,
        canViewProfile: privacySettings.profile_visibility === 'public',
        canMessage: true,
        restrictionReason: null
      };
    }

    if (!requestingUserId) {
      return {
        canSendRequest: false,
        canViewProfile: privacySettings.profile_visibility === 'public',
        canMessage: false,
        restrictionReason: "Must be logged in to send friend requests"
      };
    }

    if (privacySettings.allow_follows_from === 'nobody') {
      return {
        canSendRequest: false,
        canViewProfile: privacySettings.profile_visibility === 'public',
        canMessage: false,
        restrictionReason: "This user is not accepting friend requests"
      };
    }

    if (privacySettings.allow_follows_from === 'friends_only') {
      const connectionStatus = await checkConnectionStatus(requestingUserId, targetUserId);
      const isAlreadyConnected = connectionStatus === 'connected';
      
      return {
        canSendRequest: !isAlreadyConnected,
        canViewProfile: isAlreadyConnected || privacySettings.profile_visibility === 'public',
        canMessage: isAlreadyConnected,
        restrictionReason: isAlreadyConnected ? "Already connected" : "Only accepts requests from friends"
      };
    }

    return {
      canSendRequest: true,
      canViewProfile: true,
      canMessage: true,
      restrictionReason: null
    };

  } catch (error) {
    console.error('Error checking connection permissions:', error);
    // Default to restrictive permissions on error
    return {
      canSendRequest: false,
      canViewProfile: false,
      canMessage: false,
      restrictionReason: "Unable to verify permissions"
    };
  }
};
