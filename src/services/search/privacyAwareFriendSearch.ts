
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PrivacySettings = Database['public']['Tables']['privacy_settings']['Row'];

export interface PrivacyAwareFriendSearchResult {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
  bio?: string;
  can_connect: boolean;
  connection_policy: string;
}

export const privacyAwareFriendSearch = async (
  searchTerm: string,
  currentUserId: string,
  limit: number = 20
): Promise<PrivacyAwareFriendSearchResult[]> => {
  try {
    // Search for profiles matching the search term
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        username,
        profile_image,
        bio
      `)
      .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      .neq('id', currentUserId)
      .limit(limit);

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      return [];
    }

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

    // Process results
    const results: PrivacyAwareFriendSearchResult[] = profiles
      .filter(profile => 
        !connectedUserIds.has(profile.id) && 
        !blockedUserIds.has(profile.id)
      )
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

        return {
          id: profile.id,
          name: profile.name || 'Unknown User',
          username: profile.username || '',
          profile_image: profile.profile_image || undefined,
          bio: profile.bio || undefined,
          can_connect: canConnect,
          connection_policy: connectionPolicy
        };
      });

    return results;
  } catch (error) {
    console.error('Error in privacy-aware friend search:', error);
    return [];
  }
};
