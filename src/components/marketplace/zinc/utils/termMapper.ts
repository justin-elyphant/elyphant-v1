
// Helper functions for mapping search terms to more specific queries

/**
 * Map common search terms to more specific queries to improve search relevance
 */
export const findMappedTerm = (query: string): string | null => {
  const lowercaseTerm = query.toLowerCase().trim();
  
  // Category-specific mappings
  const mappings: Record<string, string> = {
    // Electronics
    'macbook': 'apple macbook laptop',
    'mac book': 'apple macbook laptop',
    'airpods': 'apple airpods headphones',
    'ipad': 'apple ipad tablet',
    'iphone': 'apple iphone smartphone',
    
    // Padres merchandise
    'padres hat': 'san diego padres baseball hat',
    'san diego hat': 'san diego padres baseball hat',
    'padres cap': 'san diego padres baseball cap',
    
    // Planter/Garden items
    'planter': 'garden planter pot container for plants',
    'outdoor planter': 'outdoor garden planter pot for plants patio',
    'plant pot': 'garden planter pot for plants',
    'flower pot': 'garden flower planter pot',
    'garden pot': 'outdoor garden planter pot for plants',
    
    // Generic categories
    'nike': 'nike shoes clothing athletic',
    'pet': 'pet supplies dog cat',
    'office': 'office supplies desk',
    'tech': 'electronics gadgets',
    'summer': 'summer outdoor beach',
    'birthday': 'birthday gift party',
    'wedding': 'wedding gift celebration',
  };
  
  // Check for exact matches first
  if (mappings[lowercaseTerm]) {
    return mappings[lowercaseTerm];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(mappings)) {
    if (lowercaseTerm.includes(key)) {
      return value;
    }
  }
  
  return null;
};

/**
 * Add category hints to improve search relevance
 */
export const addCategoryHints = (query: string): string => {
  const lowercaseTerm = query.toLowerCase();
  
  // Add gardening category hints for planter-related searches
  if (lowercaseTerm.includes('planter') || 
      lowercaseTerm.includes('pot') || 
      lowercaseTerm.includes('garden')) {
    return `${query} garden plant container`;
  }
  
  // Add clothing category hints for apparel searches
  if (lowercaseTerm.includes('hat') || 
      lowercaseTerm.includes('cap') || 
      lowercaseTerm.includes('shirt') || 
      lowercaseTerm.includes('shoes')) {
    return `${query} clothing apparel`;
  }
  
  // Add electronics category for tech searches
  if (lowercaseTerm.includes('headphone') || 
      lowercaseTerm.includes('speaker') || 
      lowercaseTerm.includes('laptop') ||
      lowercaseTerm.includes('phone') ||
      lowercaseTerm.includes('tablet')) {
    return `${query} electronics`;
  }
  
  return query;
};
