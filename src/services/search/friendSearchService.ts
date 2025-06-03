
import { supabase } from "@/integrations/supabase/client";

export interface FriendSearchResult {
  id: string;
  name: string;
  username: string;
  email: string;
  profile_image?: string;
  bio?: string;
  connectionStatus: 'connected' | 'pending' | 'none' | 'blocked';
}

export const searchFriends = async (query: string, currentUserId?: string): Promise<FriendSearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    // Search by name, username, or email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, username, email, profile_image, bio')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching friends:', error);
      return [];
    }

    if (!profiles || profiles.length === 0) return [];

    // If user is authenticated, check connection status
    if (currentUserId) {
      const profileIds = profiles.map(p => p.id);
      
      const { data: connections } = await supabase
        .from('user_connections')
        .select('connected_user_id, user_id, status')
        .or(`user_id.eq.${currentUserId},connected_user_id.eq.${currentUserId}`)
        .in('connected_user_id', profileIds.concat([currentUserId]))
        .in('user_id', profileIds.concat([currentUserId]));

      return profiles.map(profile => {
        // Skip current user
        if (profile.id === currentUserId) return null;
        
        const connection = connections?.find(conn => 
          (conn.user_id === currentUserId && conn.connected_user_id === profile.id) ||
          (conn.connected_user_id === currentUserId && conn.user_id === profile.id)
        );

        let connectionStatus: FriendSearchResult['connectionStatus'] = 'none';
        if (connection) {
          connectionStatus = connection.status === 'accepted' ? 'connected' : 'pending';
        }

        return {
          id: profile.id,
          name: profile.name || 'Unknown User',
          username: profile.username || '',
          email: profile.email || '',
          profile_image: profile.profile_image,
          bio: profile.bio,
          connectionStatus
        };
      }).filter(Boolean) as FriendSearchResult[];
    }

    // For non-authenticated users, return basic info
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.name || 'Unknown User',
      username: profile.username || '',
      email: profile.email || '',
      profile_image: profile.profile_image,
      bio: profile.bio,
      connectionStatus: 'none' as const
    }));

  } catch (error) {
    console.error('Error in friend search:', error);
    return [];
  }
};

export const sendConnectionRequest = async (targetUserId: string, relationshipType: string = 'friend') => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
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
