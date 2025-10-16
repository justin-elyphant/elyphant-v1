
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

export const sendConnectionRequest = async (targetUserId: string, relationshipType: string = 'friend') => {
  console.log('🔗 [friendSearchService] Starting connection request:', { targetUserId, relationshipType });
  
  try {
    // Enhanced authentication validation
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('🔗 [friendSearchService] Auth error:', authError);
      return { success: false, error: new Error(`Authentication failed: ${authError.message}`) };
    }
    
    if (!user) {
      console.error('🔗 [friendSearchService] No user found in auth');
      return { success: false, error: new Error('User not authenticated') };
    }

    console.log('🔗 [friendSearchService] Authenticated user:', user.id);

    // Check for existing connection to prevent duplicates
    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${user.id})`)
      .maybeSingle();

    if (existingConnection) {
      console.log('🔗 [friendSearchService] Connection already exists:', existingConnection.status);
      return { 
        success: false, 
        error: new Error(`Connection already exists with status: ${existingConnection.status}`) 
      };
    }

    console.log('🔗 [friendSearchService] Inserting connection request...');
    
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

    if (error) {
      console.error('🔗 [friendSearchService] Database error:', error);
      return { 
        success: false, 
        error: new Error(`Database error: ${error.message} (Code: ${error.code})`) 
      };
    }

    console.log('🔗 [friendSearchService] Connection request successful:', data);
    return { success: true, data };
    
  } catch (error: any) {
    console.error('🔗 [friendSearchService] Unexpected error:', error);
    return { 
      success: false, 
      error: new Error(`Unexpected error: ${error.message || error}`) 
    };
  }
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
