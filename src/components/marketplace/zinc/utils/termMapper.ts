
/**
 * Maps search terms to appropriate full search terms
 */
export const getWellKnownTermMappings = (): Record<string, string> => {
  return {
    "dallas": "dallas cowboys",
    "cowboys": "dallas cowboys",
    "iphone": "apple iphone",
    "samsung": "samsung galaxy",
    "playstation": "sony playstation",
    "xbox": "microsoft xbox",
    "adidas": "adidas shoes",
    "puma": "puma shoes",
    "nike": "nike shoes"
  };
};

/**
 * Checks if a search term contains well-known terms and returns the mapped term
 */
export const findMappedTerm = (query: string): string | null => {
  const lowercaseQuery = query.toLowerCase();
  const wellKnownTerms = getWellKnownTermMappings();
  
  for (const term in wellKnownTerms) {
    if (lowercaseQuery.includes(term)) {
      return wellKnownTerms[term];
    }
  }
  
  return null;
};
