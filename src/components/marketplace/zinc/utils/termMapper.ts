
/**
 * Maps search terms to appropriate full search terms
 */
export const getWellKnownTermMappings = (): Record<string, string> => {
  return {
    // Sports teams
    "dallas": "dallas cowboys merchandise",
    "cowboys": "dallas cowboys merchandise",
    "padres": "san diego padres baseball hat",
    "san diego": "san diego padres baseball hat",
    
    // Apple products
    "macbook": "apple macbook",
    "iphone": "apple iphone",
    "ipad": "apple ipad",
    "airpods": "apple airpods",
    "apple watch": "apple watch",
    
    // Samsung products
    "samsung": "samsung galaxy",
    "galaxy": "samsung galaxy",
    
    // Gaming consoles
    "playstation": "sony playstation",
    "xbox": "microsoft xbox",
    
    // Brands
    "adidas": "adidas shoes",
    "puma": "puma shoes",
    "nike": "nike shoes",
    
    // Clothing items
    "hat": "baseball hat",
    "cap": "baseball cap",
    "shirt": "t-shirt",
    "clothing": "clothing apparel"
  };
};

/**
 * Checks if a search term contains well-known terms and returns the mapped term
 */
export const findMappedTerm = (query: string): string | null => {
  const lowercaseQuery = query.toLowerCase();
  const wellKnownTerms = getWellKnownTermMappings();
  
  // Full match first - check if the entire query matches a key exactly
  if (wellKnownTerms[lowercaseQuery]) {
    return wellKnownTerms[lowercaseQuery];
  }
  
  // Check for specific product categories
  if (lowercaseQuery.includes("macbook") || lowercaseQuery.includes("mac book")) {
    return "apple macbook";
  }
  
  // Enhanced mapping for padres + hat/cap
  if (lowercaseQuery.includes("padres") && (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return "san diego padres baseball hat";
  }
  
  // Enhanced mapping for hats/caps - ensure they're mapped to clothing
  if (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap")) {
    return "baseball hat cap clothing";
  }
  
  // Check for partial matches
  for (const term in wellKnownTerms) {
    if (lowercaseQuery.includes(term)) {
      return wellKnownTerms[term];
    }
  }
  
  return null;
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
    return `${query} team merchandise`;
  }
  
  return query;
};
