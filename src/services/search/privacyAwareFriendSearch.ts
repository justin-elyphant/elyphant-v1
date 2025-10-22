
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
  city?: string;
  state?: string;
  connectionStatus: 'connected' | 'pending' | 'none' | 'blocked';
  mutualConnections?: number;
  lastActive?: string;
  privacyLevel?: 'public' | 'limited' | 'private';
  isPrivacyRestricted?: boolean;
  canGift?: boolean;
}

export interface PrivacyAwareFriendSearchResult {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
  bio?: string;
  can_connect: boolean;
  can_gift: boolean;
  connection_policy: string;
}

export const searchFriendsWithPrivacy = async (
  searchTerm: string,
  currentUserId?: string,
  limit: number = 20
): Promise<FilteredProfile[]> => {
  try {
    console.log(`🔍 [PRIVACY SEARCH] Starting search for: "${searchTerm}"`);
    
    // First try enhanced search for better results
    const { enhancedFriendSearch } = await import('./enhancedFriendSearch');
    const enhancedResults = await enhancedFriendSearch(searchTerm, currentUserId, limit);
    
    console.log(`🔍 [ENHANCED SEARCH] Enhanced search returned ${enhancedResults.length} results`);
    
    if (enhancedResults.length > 0) {
      console.log(`🔍 [ENHANCED SEARCH] Found ${enhancedResults.length} results, using enhanced search`);
      enhancedResults.forEach((result, index) => {
        console.log(`🔍 [ENHANCED RESULT ${index + 1}] ${result.name} (@${result.username}) - Score: ${result.searchScore}, Type: ${result.matchType}`);
      });
      return enhancedResults;
    }
    
    // Test direct query for "Dua Lipa" case to verify data exists
    if (searchTerm.toLowerCase().includes('dua lipa') || (searchTerm.toLowerCase().includes('dua') && searchTerm.toLowerCase().includes('lipa'))) {
      console.log(`🔍 [DEBUG] Testing direct query for Dua Lipa case`);
      const { data: debugQuery } = await supabase
        .from('profiles')
        .select('id, name, username, first_name, last_name, email')
        .or(`first_name.ilike.%dua%,last_name.ilike.%lipa%,name.ilike.%dua lipa%`)
        .limit(5);
      console.log(`🔍 [DEBUG] Direct query results:`, debugQuery);
    }
    
    // Fallback to original search logic
    console.log(`🔍 [FALLBACK SEARCH] No enhanced results, using original search logic`);
    
    // Clean and process the search term
    const cleanedSearchTerm = searchTerm.startsWith('@') ? searchTerm.slice(1) : searchTerm;
    const isEmailSearch = searchTerm.includes('@') && !searchTerm.startsWith('@');
    const isUsernameSearch = searchTerm.startsWith('@');
    
    console.log(`🔍 [SEARCH START] Original: "${searchTerm}", Cleaned: "${cleanedSearchTerm}"`);
    console.log(`🔍 [SEARCH TYPE] Email: ${isEmailSearch}, Username: ${isUsernameSearch}, General: ${!isEmailSearch && !isUsernameSearch}`);
    
    // Search for profiles using proper Supabase client methods
    let profiles;
    let profileError;
    
    if (isEmailSearch) {
      console.log(`🔍 [EMAIL SEARCH] Looking for exact email: "${cleanedSearchTerm}"`);
      const result = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          username,
          first_name,
          last_name,
          email,
          profile_image,
          bio,
          city,
          state,
          shipping_address
        `)
        .eq('email', cleanedSearchTerm)
        .limit(limit);
      profiles = result.data;
      profileError = result.error;
    } else if (isUsernameSearch) {
      console.log(`🔍 [USERNAME SEARCH] Looking for exact username: "${cleanedSearchTerm}"`);
      const result = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          username,
          first_name,
          last_name,
          email,
          profile_image,
          bio,
          city,
          state,
          shipping_address
        `)
        .eq('username', cleanedSearchTerm)
        .limit(limit);
      profiles = result.data;
      profileError = result.error;
    } else {
      console.log(`🔍 [GENERAL SEARCH] Looking across name fields for: "${cleanedSearchTerm}"`);
      
      // Use RPC call to bypass RLS restrictions for search functionality
      // This allows finding users that would normally be filtered by privacy policies
      const { data: searchResults, error: searchError } = await supabase.rpc('search_users_for_friends', {
        search_term: cleanedSearchTerm,
        requesting_user_id: currentUserId || null,
        search_limit: limit
      });
      
      if (searchError || !searchResults || searchResults.length === 0) {
        console.log(`🔍 [SEARCH FALLBACK] RPC ${searchError ? 'failed' : 'returned 0 results'}, trying direct query:`, searchError);
        // Fallback to direct query for users that are publicly visible
        const result = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            username,
            first_name,
            last_name,
            email,
            profile_image,
            bio,
            city,
            state,
            shipping_address
          `)
          .or(`name.ilike.%${cleanedSearchTerm}%,username.ilike.%${cleanedSearchTerm}%,first_name.ilike.%${cleanedSearchTerm}%,last_name.ilike.%${cleanedSearchTerm}%`)
          .limit(limit);
        profiles = result.data;
        profileError = result.error;
      } else {
        profiles = searchResults;
        profileError = null;
      }
    }

    if (profileError) {
      console.error(`🔍 [SEARCH ERROR] Database error:`, profileError);
      throw profileError;
    }

    console.log(`🔍 [SEARCH RESULTS] Found ${profiles?.length || 0} profiles`);
    profiles?.forEach((profile, index) => {
      console.log(`🔍 [RESULT ${index + 1}] ${profile.name} (@${profile.username}) - ${profile.email}`);
    });

    if (!profiles || profiles.length === 0) {
      console.log(`🔍 No profiles found for search term: "${cleanedSearchTerm}"`);
      return [];
    }

    console.log(`🔍 Processing ${profiles.length} profiles through privacy filter...`);

    // Get privacy settings for found profiles
    const profileIds = profiles.map(p => p.id);
    const { data: privacySettings, error: privacyError } = await supabase
      .from('privacy_settings')
      .select('user_id, allow_connection_requests_from, profile_visibility')
      .in('user_id', profileIds);

    console.log(`🔍 Privacy settings found for ${privacySettings?.length || 0} profiles:`, privacySettings);

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
      const { data: connectionRows, error } = await supabase
        .from('user_connections')
        .select('status')
        .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${profile.id}),and(user_id.eq.${profile.id},connected_user_id.eq.${currentUserId})`);

      if (error) {
        console.warn(`🔍 [CONNECTION CHECK] Error fetching connection for ${profile.id}:`, error);
      }

      let status: 'connected' | 'pending' | 'none' = 'none';
      if (connectionRows && connectionRows.length > 0) {
        if (connectionRows.some(r => r.status === 'accepted')) status = 'connected';
        else if (connectionRows.some(r => r.status === 'pending')) status = 'pending';
        else status = 'none';
      }

      return {
        profileId: profile.id,
        status
      };
    });

    const connectionStatuses = await Promise.all(connectionStatusPromises);
    const statusMap = new Map(connectionStatuses.map(cs => [cs.profileId, cs.status]));

    // Process results
    console.log(`🔍 Connected user IDs:`, Array.from(connectedUserIds));
    console.log(`🔍 Blocked user IDs:`, Array.from(blockedUserIds));
    
    const filteredProfiles = profiles.filter(profile => {
      const isBlocked = blockedUserIds.has(profile.id);
      const userPrivacy = privacySettings?.find(ps => ps.user_id === profile.id);
      const profileVisibility = userPrivacy?.profile_visibility || 'public'; // Default to public for search
      const isConnected = connectedUserIds.has(profile.id);
      
      console.log(`🔍 Profile ${profile.id} (${profile.name}): blocked=${isBlocked}, visibility=${profileVisibility}, connected=${isConnected}`);
      
      // Filter logic:
      // 1. Always filter out blocked users
      if (isBlocked) return false;
      
      // 2. Handle profile visibility for search purposes (separate from connection permissions)
      // - 'public': Always searchable
      // - 'friends': Always searchable (users can find them but connection depends on other settings)  
      // - 'private': Only searchable by existing connections (if this level exists)
      // Note: 'friends' visibility profiles should appear in search results - visibility vs connection are different
      if (profileVisibility === 'private' && !isConnected) {
        console.log(`🔍 Filtering out ${profile.name} - private profile and not connected`);
        return false;
      }
      
      console.log(`🔍 Including ${profile.name} - visibility: ${profileVisibility}, connected: ${isConnected}`);
      
      return true;
    });
    
    console.log(`🔍 After filtering: ${filteredProfiles.length} profiles remain`);
    
    const results: FilteredProfile[] = filteredProfiles
      .map(profile => {
        const userPrivacy = privacySettings?.find(ps => ps.user_id === profile.id);
        const connectionPolicy = userPrivacy?.allow_connection_requests_from || 'everyone';
        
        const connectionStatus = statusMap.get(profile.id) || 'none';
        
        // Determine if current user can connect based on privacy settings
        let canConnect = true;
        if (connectionPolicy === 'nobody') {
          canConnect = false;
        } else if (connectionPolicy === 'friends_only') {
          // For friends_only, they would need to be already connected, which we filtered out above
          canConnect = false;
        }

        // Determine if current user can gift (more permissive than connection)
        // Can gift to anyone who isn't blocked and has searchable profile
        const canGift = connectionStatus !== 'blocked';
        const privacyLevel = connectionPolicy === 'nobody' ? 'private' : 
                           connectionPolicy === 'friends_only' ? 'limited' : 'public';

        return {
          id: profile.id,
          name: profile.name || 'Unknown User',
          username: profile.username || '',
          email: '', // Email not included for privacy
          profile_image: profile.profile_image || undefined,
          bio: profile.bio || undefined,
          city: (profile as any).city || (profile as any).shipping_address?.city || undefined,
          state: (profile as any).state || (profile as any).shipping_address?.state || undefined,
          connectionStatus: connectionStatus as 'connected' | 'pending' | 'none' | 'blocked',
          mutualConnections: 0, // TODO: Implement mutual connections count
          privacyLevel: privacyLevel as 'public' | 'limited' | 'private',
          isPrivacyRestricted: !canConnect,
          canGift: canGift
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
    can_gift: profile.canGift || false,
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
    const { data: existingRows, error: existingErr } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`);

    if (existingErr) {
      console.warn('Error fetching existing connection:', existingErr);
    }

    if (existingRows && existingRows.length > 0) {
      const hasAccepted = existingRows.some(r => r.status === 'accepted');
      const hasPending = existingRows.some(r => r.status === 'pending');
      return {
        canSendRequest: false,
        canViewProfile: true,
        canMessage: hasAccepted,
        restrictionReason: hasAccepted ? 'Already connected' : 'Connection request pending'
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
