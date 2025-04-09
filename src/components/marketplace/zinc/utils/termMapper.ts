
/**
 * Maps search terms to appropriate full search terms
 */
export const getWellKnownTermMappings = (): Record<string, string> => {
  return {
    // Sports teams
    "dallas": "dallas cowboys team merchandise",
    "cowboys": "dallas cowboys team merchandise",
    "padres": "san diego padres baseball hat",
    "san diego": "san diego padres baseball hat",
    "san diego padres": "san diego padres baseball hat clothing",
    
    // Baseball teams with explicit clothing
    "yankees": "new york yankees baseball hat clothing",
    "dodgers": "los angeles dodgers baseball hat clothing",
    "athletics": "oakland athletics baseball hat clothing",
    "giants": "san francisco giants baseball hat clothing",
    
    // Apparel and clothing items with clear category
    "hat": "baseball hat clothing apparel",
    "cap": "baseball cap clothing apparel",
    "shirt": "t-shirt clothing apparel",
    "jersey": "sports team jersey clothing apparel",
    "clothing": "clothing apparel",
    
    // Apple products
    "macbook": "apple macbook laptop",
    "iphone": "apple iphone smartphone",
    "ipad": "apple ipad tablet",
    "airpods": "apple airpods headphones",
    "apple watch": "apple watch smartwatch",
    
    // Samsung products
    "samsung": "samsung galaxy smartphone",
    "galaxy": "samsung galaxy smartphone",
    
    // Gaming consoles
    "playstation": "sony playstation gaming console",
    "xbox": "microsoft xbox gaming console",
    
    // Brands with product type
    "adidas": "adidas shoes clothing",
    "puma": "puma shoes clothing",
    "nike": "nike shoes clothing"
  };
};

/**
 * Checks if a search term contains well-known terms and returns the mapped term
 */
export const findMappedTerm = (query: string): string | null => {
  const lowercaseQuery = query.toLowerCase();
  const wellKnownTerms = getWellKnownTermMappings();
  
  // Perfect match - check if the entire query matches a key exactly
  if (wellKnownTerms[lowercaseQuery]) {
    return wellKnownTerms[lowercaseQuery];
  }
  
  // Special case: padres hat/cap combination
  if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
      (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return "san diego padres baseball hat clothing apparel";
  }
  
  // Special case: any team + hat/cap combination
  if ((lowercaseQuery.includes("team") || 
       lowercaseQuery.includes("baseball") ||
       lowercaseQuery.includes("football") ||
       lowercaseQuery.includes("basketball")) && 
      (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return lowercaseQuery + " clothing apparel";
  }
  
  // Check for specific product categories
  if (lowercaseQuery.includes("macbook") || lowercaseQuery.includes("mac book")) {
    return "apple macbook laptop";
  }
  
  // Enhanced mapping for hats/caps - ensure they're mapped to clothing
  if (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap")) {
    return "baseball hat cap clothing apparel";
  }
  
  // Check for partial matches - find the longest matching term
  let bestMatch = null;
  let bestMatchLength = 0;
  
  for (const term in wellKnownTerms) {
    if (lowercaseQuery.includes(term) && term.length > bestMatchLength) {
      bestMatch = wellKnownTerms[term];
      bestMatchLength = term.length;
    }
  }
  
  return bestMatch;
};

/**
 * Add category hints to a search query to improve relevance
 */
export const addCategoryHints = (query: string): string => {
  const lowercaseQuery = query.toLowerCase();
  
  // Add category hints for clothing searches
  if (lowercaseQuery.includes("hat") || 
      lowercaseQuery.includes("cap") ||
      lowercaseQuery.includes("shirt") ||
      lowercaseQuery.includes("jersey")) {
    return `${query} clothing apparel`;
  }
  
  // Add category hints for sports team merchandise
  if (lowercaseQuery.includes("padres") ||
      lowercaseQuery.includes("cowboys") ||
      lowercaseQuery.includes("yankees") ||
      lowercaseQuery.includes("lakers")) {
    if (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap")) {
      return `${query} baseball hat team merchandise clothing`;
    }
    return `${query} team merchandise`;
  }
  
  // Specific combination for San Diego Padres hat
  if ((lowercaseQuery.includes("san diego") || lowercaseQuery.includes("padres")) &&
      (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return `${query} baseball clothing apparel`;
  }
  
  return query;
};
