
import { supabase } from "@/integrations/supabase/client";
import { searchFriendsWithPrivacy, FilteredProfile } from "./privacyAwareFriendSearch";

export interface FriendSearchResult {
  id: string;
  name: string;
  username: string;
  email: string;
  profile_image?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  connectionStatus: 'connected' | 'pending' | 'none' | 'blocked';
  mutualConnections?: number;
  lastActive?: string;
  privacyLevel?: 'public' | 'limited' | 'private';
  isPrivacyRestricted?: boolean;
  canGift?: boolean;
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
      avatar_url: profile.profile_image,
      bio: profile.bio,
      city: profile.city,
      state: profile.state,
      connectionStatus: profile.connectionStatus,
      mutualConnections: profile.mutualConnections,
      lastActive: profile.lastActive,
      privacyLevel: profile.privacyLevel,
      isPrivacyRestricted: profile.isPrivacyRestricted,
      canGift: profile.canGift
    }));

    console.log(`Found ${results.length} friend results for query: "${query}"`);
    return results;

  } catch (error) {
    console.error('Error in friend search:', error);
    return [];
  }
};

/**
 * Send a connection request to another user
 * Email notifications are now handled automatically via database triggers
 * @deprecated Use the unified connectionService instead
 */
export const sendConnectionRequest = async (targetUserId: string, relationshipType: string = 'friend') => {
  console.log('🔗 [friendSearchService - DEPRECATED] Use connectionService.sendConnectionRequest instead');
  
  // Import and use unified service
  const { sendConnectionRequest: unifiedSendRequest } = await import('@/services/connections/connectionService');
  return unifiedSendRequest(targetUserId, relationshipType as any);
};

export const checkConnectionStatus = async (currentUserId: string, targetUserId: string): Promise<FriendSearchResult['connectionStatus']> => {
  try {
    const { data: rows, error } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`);

    if (error) throw error;

    if (!rows || rows.length === 0) return 'none';

    return rows.some(r => r.status === 'accepted') ? 'connected' : 'pending';
  } catch (error) {
    console.error('Error checking connection status:', error);
    return 'none';
  }
};
