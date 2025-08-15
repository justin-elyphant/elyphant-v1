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
 * Search by exact email
 */
async function searchByEmail(email: string, profiles: Map<string, any>) {
  const { data } = await supabase
    .from('profiles')
    .select(`
      id, name, username, first_name, last_name, email, profile_image, bio
    `)
    .eq('email', email)
    .limit(1);
    
  if (data) {
    data.forEach(profile => {
      profiles.set(profile.id, { ...profile, matchType: 'exactEmail', searchScore: 100 });
    });
  }
}

/**
 * Search by username with both exact and partial matching
 */
async function searchByUsername(username: string, profiles: Map<string, any>, limit: number) {
  // Exact username match first
  const { data: exactMatch } = await supabase
    .from('profiles')
    .select(`
      id, name, username, first_name, last_name, email, profile_image, bio
    `)
    .eq('username', username)
    .limit(5);
    
  if (exactMatch) {
    exactMatch.forEach(profile => {
      profiles.set(profile.id, { ...profile, matchType: 'exactUsername', searchScore: 100 });
    });
  }
  
  // Partial username match if exact didn't return results
  if (!exactMatch?.length) {
    const { data: partialMatch } = await supabase
      .from('profiles')
      .select(`
        id, name, username, first_name, last_name, email, profile_image, bio
      `)
      .ilike('username', `%${username}%`)
      .limit(limit);
      
    if (partialMatch) {
      partialMatch.forEach(profile => {
        if (!profiles.has(profile.id)) {
          profiles.set(profile.id, { ...profile, matchType: 'partialUsername', searchScore: 80 });
        }
      });
    }
  }
}

/**
 * Search by name with intelligent name matching
 */
async function searchByName(processedQuery: any, variations: string[], profiles: Map<string, any>, limit: number) {
  const { nameTokens } = processedQuery;
  
  console.log(`🔍 [NAME SEARCH] Starting with tokens:`, nameTokens);
  
  if (!nameTokens) {
    console.log(`🔍 [NAME SEARCH] No name tokens found, skipping`);
    return;
  }
  
  // Search for exact first + last name combinations
  if (nameTokens.firstName && nameTokens.lastName) {
    console.log(`🔍 [NAME SEARCH] Searching for: "${nameTokens.firstName}" + "${nameTokens.lastName}"`);
    
    // Original order: first last
    const { data: originalOrder, error: originalError } = await supabase
      .from('profiles')
      .select(`
        id, name, username, first_name, last_name, email, profile_image, bio
      `)
      .ilike('first_name', `${nameTokens.firstName}%`)
      .ilike('last_name', `${nameTokens.lastName}%`)
      .limit(10);
      
    console.log(`🔍 [NAME SEARCH] Original order query result:`, { data: originalOrder, error: originalError });
      
    if (originalOrder && originalOrder.length > 0) {
      console.log(`🔍 [NAME SEARCH] Found ${originalOrder.length} profiles in original order`);
      originalOrder.forEach(profile => {
        console.log(`🔍 [NAME SEARCH] Adding profile: ${profile.first_name} ${profile.last_name} (${profile.name})`);
        profiles.set(profile.id, { ...profile, matchType: 'fullNameMatch', searchScore: 95 });
      });
    }
    
    // Reversed order: last first
    const { data: reversedOrder, error: reversedError } = await supabase
      .from('profiles')
      .select(`
        id, name, username, first_name, last_name, email, profile_image, bio
      `)
      .ilike('first_name', `${nameTokens.lastName}%`)
      .ilike('last_name', `${nameTokens.firstName}%`)
      .limit(10);
      
    console.log(`🔍 [NAME SEARCH] Reversed order query result:`, { data: reversedOrder, error: reversedError });
      
    if (reversedOrder && reversedOrder.length > 0) {
      console.log(`🔍 [NAME SEARCH] Found ${reversedOrder.length} profiles in reversed order`);
      reversedOrder.forEach(profile => {
        if (!profiles.has(profile.id)) {
          console.log(`🔍 [NAME SEARCH] Adding reversed profile: ${profile.first_name} ${profile.last_name} (${profile.name})`);
          profiles.set(profile.id, { ...profile, matchType: 'fullNameMatch', searchScore: 90 });
        }
      });
    }
  }
  
  // Search by individual name parts
  if (nameTokens.firstName) {
    console.log(`🔍 [NAME SEARCH] Searching individual name parts for: "${nameTokens.firstName}"`);
    
    const { data: firstNameMatches, error: firstNameError } = await supabase
      .from('profiles')
      .select(`
        id, name, username, first_name, last_name, email, profile_image, bio
      `)
      .or(`first_name.ilike.%${nameTokens.firstName}%,last_name.ilike.%${nameTokens.firstName}%`)
      .limit(limit);
      
    console.log(`🔍 [NAME SEARCH] Individual name parts result:`, { data: firstNameMatches, error: firstNameError });
      
    if (firstNameMatches && firstNameMatches.length > 0) {
      console.log(`🔍 [NAME SEARCH] Found ${firstNameMatches.length} profiles matching individual name parts`);
      firstNameMatches.forEach(profile => {
        if (!profiles.has(profile.id)) {
          const matchType = profile.first_name?.toLowerCase().includes(nameTokens.firstName!.toLowerCase()) 
            ? 'firstNameMatch' : 'lastNameMatch';
          console.log(`🔍 [NAME SEARCH] Adding individual match: ${profile.first_name} ${profile.last_name} (${matchType})`);
          profiles.set(profile.id, { ...profile, matchType, searchScore: 75 });
        }
      });
    }
  }
  
  // Fallback to general name search
  const fullQuery = `${nameTokens.firstName} ${nameTokens.lastName || ''}`.trim();
  console.log(`🔍 [NAME SEARCH] Fallback general search for: "${fullQuery}"`);
  
  const { data: generalMatches, error: generalError } = await supabase
    .from('profiles')
    .select(`
      id, name, username, first_name, last_name, email, profile_image, bio
    `)
    .ilike('name', `%${fullQuery}%`)
    .limit(limit);
    
  console.log(`🔍 [NAME SEARCH] General fallback result:`, { data: generalMatches, error: generalError });
    
  if (generalMatches && generalMatches.length > 0) {
    console.log(`🔍 [NAME SEARCH] Found ${generalMatches.length} profiles in general fallback`);
    generalMatches.forEach(profile => {
      if (!profiles.has(profile.id)) {
        console.log(`🔍 [NAME SEARCH] Adding general match: ${profile.name}`);
        profiles.set(profile.id, { ...profile, matchType: 'partialName', searchScore: 60 });
      }
    });
  }
  
  console.log(`🔍 [NAME SEARCH] Completed - Total profiles found: ${profiles.size}`);
}

/**
 * General search across all fields
 */
async function searchGeneral(query: string, profiles: Map<string, any>, limit: number) {
  const { data } = await supabase
    .from('profiles')
    .select(`
      id, name, username, first_name, last_name, email, profile_image, bio
    `)
    .or(`name.ilike.%${query}%,username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(limit);
    
  if (data) {
    data.forEach(profile => {
      profiles.set(profile.id, { ...profile, matchType: 'generalMatch', searchScore: 50 });
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
      
      return {
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
        connectionStatus: 'none' as const,
        mutualConnections: 0,
        privacyLevel: 'public' as const,
        isPrivacyRestricted: false
      };
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