/**
 * Enhanced search query processing utilities
 */

export interface ProcessedQuery {
  originalQuery: string;
  cleanedQuery: string;
  searchType: 'email' | 'username' | 'name' | 'general';
  isMultiWord: boolean;
  nameTokens?: {
    firstName?: string;
    lastName?: string;
    combinations: string[];
  };
  searchHints: string[];
}

/**
 * Process and analyze a search query to determine optimal search strategy
 */
export function processSearchQuery(query: string): ProcessedQuery {
  const originalQuery = query.trim();
  
  // Determine search type
  const isEmailSearch = originalQuery.includes('@') && !originalQuery.startsWith('@');
  const isUsernameSearch = originalQuery.startsWith('@');
  
  // Clean the query
  let cleanedQuery = originalQuery;
  if (isUsernameSearch) {
    cleanedQuery = originalQuery.slice(1);
  }
  
  // Check if it's a multi-word query (likely a name)
  const words = cleanedQuery.split(/\s+/).filter(word => word.length > 0);
  const isMultiWord = words.length > 1;
  
  let searchType: ProcessedQuery['searchType'] = 'general';
  if (isEmailSearch) searchType = 'email';
  else if (isUsernameSearch) searchType = 'username';
  else if (isMultiWord) searchType = 'name';
  
  // Process name tokens for multi-word queries
  let nameTokens: ProcessedQuery['nameTokens'] | undefined;
  if (isMultiWord && searchType === 'name') {
    const [first, ...rest] = words;
    const last = rest.join(' ');
    
    nameTokens = {
      firstName: first,
      lastName: last || undefined,
      combinations: [
        `${first} ${last}`, // Original order
        `${last} ${first}`, // Reversed order
        first, // First name only
        last, // Last name only
      ].filter(combo => combo.trim().length > 0)
    };
  }
  
  // Generate search hints
  const searchHints = generateSearchHints(searchType, originalQuery, isMultiWord);
  
  return {
    originalQuery,
    cleanedQuery,
    searchType,
    isMultiWord,
    nameTokens,
    searchHints
  };
}

/**
 * Generate helpful search hints based on query type
 */
function generateSearchHints(
  searchType: ProcessedQuery['searchType'], 
  query: string, 
  isMultiWord: boolean
): string[] {
  const hints: string[] = [];
  
  switch (searchType) {
    case 'email':
      hints.push("Searching by email address");
      if (query.includes('@gmail')) hints.push("Looking for Gmail users");
      break;
      
    case 'username':
      hints.push("Searching by username");
      hints.push("Try without @ for broader search");
      break;
      
    case 'name':
      hints.push("Searching by full name");
      hints.push("Try individual names or @username");
      break;
      
    case 'general':
      if (query.length < 3) {
        hints.push("Type at least 3 characters for better results");
      } else {
        hints.push("Searching across names and usernames");
        hints.push("Try @username for exact username match");
      }
      break;
  }
  
  return hints;
}

/**
 * Create search variations for better matching
 */
export function createSearchVariations(processedQuery: ProcessedQuery): string[] {
  const variations: string[] = [processedQuery.cleanedQuery];
  
  if (processedQuery.nameTokens) {
    variations.push(...processedQuery.nameTokens.combinations);
  }
  
  // Add partial email matching for domains
  if (processedQuery.searchType === 'general' && processedQuery.cleanedQuery.includes('@')) {
    const domain = processedQuery.cleanedQuery.split('@')[1];
    if (domain) {
      variations.push(`@${domain}`);
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Determine search priority weights for ranking results
 */
export function getSearchWeights(processedQuery: ProcessedQuery): Record<string, number> {
  const baseWeights = {
    exactUsername: 100,
    exactEmail: 95,
    fullNameMatch: 90,
    firstNameMatch: 70,
    lastNameMatch: 70,
    partialUsername: 60,
    partialName: 50,
    generalMatch: 30
  };
  
  // Adjust weights based on query type
  switch (processedQuery.searchType) {
    case 'username':
      return {
        ...baseWeights,
        exactUsername: 100,
        partialUsername: 80
      };
      
    case 'email':
      return {
        ...baseWeights,
        exactEmail: 100
      };
      
    case 'name':
      return {
        ...baseWeights,
        fullNameMatch: 100,
        firstNameMatch: 85,
        lastNameMatch: 85
      };
      
    default:
      return baseWeights;
  }
}