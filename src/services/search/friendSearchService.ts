
import { supabase } from "@/integrations/supabase/client";
import { searchFriendsWithPrivacy, FilteredProfile } from "./privacyAwareFriendSearch";

export interface FriendSearchResult {
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

export const searchFriends = async (query: string, currentUserId?: string): Promise<FriendSearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    console.log(`Searching for friends with query: "${query}"`);
    
    // Use privacy-aware search
    const privacyResults = await searchFriendsWithPrivacy(query, currentUserId);
    
    // Convert FilteredProfile to FriendSearchResult for backward compatibility
    const results: FriendSearchResult[] = privacyResults.map(profile => ({
      id: profile.id,
      name: profile.name,
      username: profile.username,
      email: profile.email || '', // Default to empty string for backward compatibility
      profile_image: profile.profile_image,
      bio: profile.bio,
      connectionStatus: profile.connectionStatus,
      mutualConnections: profile.mutualConnections,
      lastActive: profile.lastActive,
      privacyLevel: profile.privacyLevel,
      isPrivacyRestricted: profile.isPrivacyRestricted
    }));

    console.log(`Found ${results.length} friend results for query: "${query}"`);
    return results;

  } catch (error) {
    console.error('Error in friend search:', error);
    return [];
  }
};

export const sendConnectionRequest = async (targetUserId: string, relationshipType: string = 'friend') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.id,
        connected_user_id: targetUserId,
        relationship_type: relationshipType,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error sending connection request:', error);
    return { success: false, error };
  }
};

export const checkConnectionStatus = async (currentUserId: string, targetUserId: string): Promise<FriendSearchResult['connectionStatus']> => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return 'none';
    
    return data.status === 'accepted' ? 'connected' : 'pending';
  } catch (error) {
    console.error('Error checking connection status:', error);
    return 'none';
  }
};
