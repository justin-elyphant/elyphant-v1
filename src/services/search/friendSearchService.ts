
import { supabase } from "@/integrations/supabase/client";

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
}

export const searchFriends = async (query: string, currentUserId?: string): Promise<FriendSearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    console.log(`Searching for friends with query: "${query}"`);
    
    // Search by name, username, or email with corrected Supabase syntax
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, username, email, profile_image, bio')
      .or(`name.ilike.${searchTerm},username.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10);

    if (error) {
      console.error('Error searching friends:', error);
      return [];
    }

    console.log(`Found ${profiles?.length || 0} profile matches for query: "${query}"`);
    console.log('Profiles found:', profiles);

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

      console.log('Connection data:', connections);

      return profiles
        .filter(profile => profile.id !== currentUserId) // Exclude current user
        .map(profile => {
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
            connectionStatus,
            mutualConnections: 0, // TODO: Calculate mutual connections
            lastActive: 'Recently' // TODO: Get actual last active time
          };
        });
    }

    // For non-authenticated users, return basic info (excluding current user)
    return profiles
      .filter(profile => profile.id !== currentUserId)
      .map(profile => ({
        id: profile.id,
        name: profile.name || 'Unknown User',
        username: profile.username || '',
        email: profile.email || '',
        profile_image: profile.profile_image,
        bio: profile.bio,
        connectionStatus: 'none' as const,
        mutualConnections: 0,
        lastActive: 'Recently'
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
