/**
 * Enhanced friend search service with improved query processing and ranking
 */

import { supabase } from "@/integrations/supabase/client";
import { processSearchQuery, createSearchVariations, getSearchWeights } from "@/utils/searchQueryProcessing";
import type { FilteredProfile } from "./privacyAwareFriendSearch";

export interface RankedSearchResult extends FilteredProfile {
  searchScore: number;
  matchType: string;
  matchReasons: string[];
}

/**
 * Enhanced search with intelligent query processing and result ranking
 */
export async function enhancedFriendSearch(
  searchTerm: string,
  currentUserId?: string,
  limit: number = 20
): Promise<RankedSearchResult[]> {
  try {
    // Process the search query
    const processedQuery = processSearchQuery(searchTerm);
    const searchVariations = createSearchVariations(processedQuery);
    const weights = getSearchWeights(processedQuery);
    
    console.log(`🔍 [ENHANCED SEARCH] Processing query:`, {
      original: processedQuery.originalQuery,
      type: processedQuery.searchType,
      variations: searchVariations,
      hints: processedQuery.searchHints
    });
    
    // Build optimized search queries based on query type
    const searchResults = await executeOptimizedSearch(processedQuery, searchVariations, limit);
    
    if (!searchResults.length) {
      console.log(`🔍 [ENHANCED SEARCH] No results found`);
      return [];
    }
    
    // Apply privacy filtering
    const filteredResults = await applyPrivacyFiltering(searchResults, currentUserId);
    
    // Rank and score results
    const rankedResults = rankSearchResults(filteredResults, processedQuery, weights);
    
    console.log(`🔍 [ENHANCED SEARCH] Returning ${rankedResults.length} ranked results`);
    
    return rankedResults.slice(0, limit);
    
  } catch (error) {
    console.error('🔍 [ENHANCED SEARCH] Error:', error);
    return [];
  }
}

/**
 * Execute optimized search based on query type
 */
async function executeOptimizedSearch(
  processedQuery: any,
  variations: string[],
  limit: number
) {
  const profiles = new Map();
  
  // Execute different search strategies based on query type
  switch (processedQuery.searchType) {
    case 'email':
      await searchByEmail(processedQuery.cleanedQuery, profiles);
      break;
      
    case 'username':
      await searchByUsername(processedQuery.cleanedQuery, profiles, limit);
      break;
      
    case 'name':
      await searchByName(processedQuery, variations, profiles, limit);
      break;
      
    default:
      await searchGeneral(processedQuery.cleanedQuery, profiles, limit);
      break;
  }
  
  return Array.from(profiles.values());
}

/**
 * Search by exact email using RPC to bypass RLS
 */
async function searchByEmail(email: string, profiles: Map<string, any>) {
  const { data } = await supabase.rpc('search_users_for_friends', {
    search_term: email,
    requesting_user_id: null,
    search_limit: 5
  });
    
  if (data) {
    // Filter for exact email matches
    const exactMatches = data.filter(profile => profile.email?.toLowerCase() === email.toLowerCase());
    exactMatches.forEach(profile => {
      profiles.set(profile.id, { ...profile, matchType: 'exactEmail', searchScore: 100 });
    });
  }
}

/**
 * Search by username using RPC to bypass RLS
 */
async function searchByUsername(username: string, profiles: Map<string, any>, limit: number) {
  // Use RPC for username search
  const { data } = await supabase.rpc('search_users_for_friends', {
    search_term: username,
    requesting_user_id: null,
    search_limit: limit
  });
    
  if (data) {
    data.forEach(profile => {
      const isExactMatch = profile.username?.toLowerCase() === username.toLowerCase();
      const matchType = isExactMatch ? 'exactUsername' : 'partialUsername';
      const score = isExactMatch ? 100 : 80;
      
      if (!profiles.has(profile.id)) {
        profiles.set(profile.id, { ...profile, matchType, searchScore: score });
      }
    });
  }
}

/**
 * Search by name using RPC to bypass RLS - more efficient single call
 */
async function searchByName(processedQuery: any, variations: string[], profiles: Map<string, any>, limit: number) {
  const { nameTokens } = processedQuery;
  
  console.log(`🔍 [NAME SEARCH] Starting with tokens:`, nameTokens);
  
  if (!nameTokens) {
    console.log(`🔍 [NAME SEARCH] No name tokens found, skipping`);
    return;
  }
  
  // Try different search strategies using RPC
  if (nameTokens.firstName && nameTokens.lastName) {
    console.log(`🔍 [NAME SEARCH] Searching for: "${nameTokens.firstName}" + "${nameTokens.lastName}"`);
    
    // Search with "firstName lastName" format
    const fullName1 = `${nameTokens.firstName} ${nameTokens.lastName}`;
    const { data: results1 } = await supabase.rpc('search_users_for_friends', {
      search_term: fullName1,
      requesting_user_id: null,
      search_limit: limit
    });
    
    if (results1) {
      results1.forEach(profile => {
        const isExactFullName = profile.name?.toLowerCase() === fullName1.toLowerCase();
        const isFirstLastMatch = profile.first_name?.toLowerCase().includes(nameTokens.firstName!.toLowerCase()) && 
                                profile.last_name?.toLowerCase().includes(nameTokens.lastName!.toLowerCase());
        
        let matchType = 'partialName';
        let score = 60;
        
        if (isExactFullName) {
          matchType = 'fullNameMatch';
          score = 95;
        } else if (isFirstLastMatch) {
          matchType = 'fullNameMatch';
          score = 90;
        }
        
        console.log(`🔍 [NAME SEARCH] Adding profile: ${profile.first_name} ${profile.last_name} (${profile.name}) - ${matchType}`);
        profiles.set(profile.id, { ...profile, matchType, searchScore: score });
      });
    }
    
    // Try reversed order: "lastName firstName"
    const fullName2 = `${nameTokens.lastName} ${nameTokens.firstName}`;
    const { data: results2 } = await supabase.rpc('search_users_for_friends', {
      search_term: fullName2,
      requesting_user_id: null,
      search_limit: limit
    });
    
    if (results2) {
      results2.forEach(profile => {
        if (!profiles.has(profile.id)) {
          console.log(`🔍 [NAME SEARCH] Adding reversed profile: ${profile.first_name} ${profile.last_name} (${profile.name})`);
          profiles.set(profile.id, { ...profile, matchType: 'fullNameMatch', searchScore: 85 });
        }
      });
    }
  }
  
  // Search by first name only if we don't have enough results
  if (nameTokens.firstName && profiles.size < limit / 2) {
    console.log(`🔍 [NAME SEARCH] Searching for first name: "${nameTokens.firstName}"`);
    
    const { data: firstNameResults } = await supabase.rpc('search_users_for_friends', {
      search_term: nameTokens.firstName,
      requesting_user_id: null,
      search_limit: limit
    });
    
    if (firstNameResults) {
      firstNameResults.forEach(profile => {
        if (!profiles.has(profile.id)) {
          const matchType = profile.first_name?.toLowerCase().includes(nameTokens.firstName!.toLowerCase()) 
            ? 'firstNameMatch' : 'lastNameMatch';
          console.log(`🔍 [NAME SEARCH] Adding individual match: ${profile.first_name} ${profile.last_name} (${matchType})`);
          profiles.set(profile.id, { ...profile, matchType, searchScore: 75 });
        }
      });
    }
  }
  
  console.log(`🔍 [NAME SEARCH] Completed - Total profiles found: ${profiles.size}`);
}

/**
 * General search using RPC to bypass RLS
 */
async function searchGeneral(query: string, profiles: Map<string, any>, limit: number) {
  const { data } = await supabase.rpc('search_users_for_friends', {
    search_term: query,
    requesting_user_id: null,
    search_limit: limit
  });
    
  if (data) {
    data.forEach(profile => {
      if (!profiles.has(profile.id)) {
        profiles.set(profile.id, { ...profile, matchType: 'generalMatch', searchScore: 50 });
      }
    });
  }
}

/**
 * Apply privacy filtering to search results
 */
async function applyPrivacyFiltering(profiles: any[], currentUserId?: string): Promise<any[]> {
  if (!profiles.length || !currentUserId) return profiles;
  
  const profileIds = profiles.map(p => p.id);
  
  // Get privacy settings and connections in parallel
  const [privacyResult, connectionResult, blockResult] = await Promise.all([
    supabase
      .from('privacy_settings')
      .select('user_id, allow_connection_requests_from, profile_visibility')
      .in('user_id', profileIds),
    supabase
      .from('user_connections')
      .select('user_id, connected_user_id, status')
      .or(`and(user_id.eq.${currentUserId},connected_user_id.in.(${profileIds.join(',')})),and(user_id.in.(${profileIds.join(',')}),connected_user_id.eq.${currentUserId})`),
    supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.in.(${profileIds.join(',')})),and(blocker_id.in.(${profileIds.join(',')}),blocked_id.eq.${currentUserId})`)
  ]);
  
  const privacySettings = privacyResult.data || [];
  const connections = connectionResult.data || [];
  const blocks = blockResult.data || [];
  
  // Create lookup maps
  const privacyMap = new Map(privacySettings.map(ps => [ps.user_id, ps]));
  const connectionMap = new Map(connections.map(conn => [
    conn.user_id === currentUserId ? conn.connected_user_id : conn.user_id,
    conn.status
  ]));
  const blockedIds = new Set(blocks.flatMap(b => [
    b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id
  ]));
  
  // Filter based on privacy rules
  return profiles.filter(profile => {
    // Filter out blocked users
    if (blockedIds.has(profile.id)) return false;
    
    // Check profile visibility
    const privacy = privacyMap.get(profile.id);
    const visibility = privacy?.profile_visibility || 'public';
    const isConnected = connectionMap.has(profile.id);
    
    // Private profiles only visible to connections
    if (visibility === 'private' && !isConnected) return false;
    
    return true;
  });
}

/**
 * Rank and score search results
 */
function rankSearchResults(
  profiles: any[],
  processedQuery: any,
  weights: Record<string, number>
): RankedSearchResult[] {
  return profiles
    .map(profile => {
      const matchReasons = calculateMatchReasons(profile, processedQuery);
      const finalScore = weights[profile.matchType] || 30;
      
      const formattedResult = {
        ...profile,
        searchScore: finalScore,
        matchReasons,
        matchType: profile.matchType,
        // Ensure required fields are properly set
        id: profile.id,
        name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
        username: profile.username || '',
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email || '', // Keep email for debugging
        profile_image: profile.profile_image,
        bio: profile.bio,
        // Map city/state from shipping_address when available
        city: (profile as any)?.city || (profile as any)?.shipping_address?.city,
        state: (profile as any)?.state || (profile as any)?.shipping_address?.state,
        connectionStatus: 'none' as const,
        mutualConnections: 0,
        privacyLevel: 'public' as const,
        isPrivacyRestricted: false
      };
      
      console.log(`🔍 [ENHANCED RANKING] Profile ${profile.id} formatted:`, {
        id: formattedResult.id,
        name: formattedResult.name,
        username: formattedResult.username,
        city: formattedResult.city,
        state: formattedResult.state,
        shipping_address: (profile as any)?.shipping_address,
        matchType: formattedResult.matchType,
        searchScore: formattedResult.searchScore
      });
      
      return formattedResult;
    })
    .sort((a, b) => b.searchScore - a.searchScore);
}

/**
 * Calculate match reasons for display
 */
function calculateMatchReasons(profile: any, processedQuery: any): string[] {
  const reasons: string[] = [];
  
  switch (profile.matchType) {
    case 'exactUsername':
      reasons.push('Exact username match');
      break;
    case 'exactEmail':
      reasons.push('Email address match');
      break;
    case 'fullNameMatch':
      reasons.push('Full name match');
      break;
    case 'firstNameMatch':
      reasons.push('First name match');
      break;
    case 'lastNameMatch':
      reasons.push('Last name match');
      break;
    case 'partialUsername':
      reasons.push('Username contains search term');
      break;
    case 'partialName':
      reasons.push('Name contains search term');
      break;
    default:
      reasons.push('General match');
  }
  
  return reasons;
}