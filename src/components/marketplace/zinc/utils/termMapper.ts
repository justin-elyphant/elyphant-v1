
/**
 * Maps search terms to appropriate full search terms
 */
export const getWellKnownTermMappings = (): Record<string, string> => {
  return {
    // Sports teams
    "dallas": "dallas cowboys",
    "cowboys": "dallas cowboys",
    "padres": "san diego padres hat",
    "san diego": "san diego padres hat",
    
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
    "cap": "baseball cap"
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
  
  if (lowercaseQuery.includes("padres") && (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return "san diego padres baseball hat";
  }
  
  // Check for partial matches
  for (const term in wellKnownTerms) {
    if (lowercaseQuery.includes(term)) {
      return wellKnownTerms[term];
    }
  }
  
  return null;
};
