
/**
 * Maps search queries to appropriate image categories for better visual results
 */
export const getImageCategory = (query: string): string => {
  const lowercaseQuery = query.toLowerCase();
  
  // Garden and planter category detection
  if (lowercaseQuery.includes('planter') || 
      lowercaseQuery.includes('pot') || 
      lowercaseQuery.includes('garden') || 
      lowercaseQuery.includes('plant')) {
    return 'Garden';
  }
  
  // Electronics category detection
  if (lowercaseQuery.includes('headphone') || 
      lowercaseQuery.includes('speaker') || 
      lowercaseQuery.includes('tv') || 
      lowercaseQuery.includes('monitor') || 
      lowercaseQuery.includes('laptop') || 
      lowercaseQuery.includes('computer') || 
      lowercaseQuery.includes('tablet') || 
      lowercaseQuery.includes('phone')) {
    return 'Electronics';
  }
  
  // Apparel category detection
  if (lowercaseQuery.includes('hat') || 
      lowercaseQuery.includes('cap') || 
      lowercaseQuery.includes('shirt') || 
      lowercaseQuery.includes('jersey') || 
      lowercaseQuery.includes('clothing') ||
      lowercaseQuery.includes('shoes') ||
      lowercaseQuery.includes('sneakers')) {
    return 'Clothing';
  }
  
  // Sports merchandise
  if (lowercaseQuery.includes('padres') || 
      lowercaseQuery.includes('baseball') || 
      lowercaseQuery.includes('nfl') || 
      lowercaseQuery.includes('nba') || 
      lowercaseQuery.includes('sport')) {
    return 'Sports Merchandise';
  }
  
  // Office supplies
  if (lowercaseQuery.includes('office') || 
      lowercaseQuery.includes('desk') || 
      lowercaseQuery.includes('chair') || 
      lowercaseQuery.includes('stationery')) {
    return 'Office';
  }
  
  // Default to a generic category if no matches
  return 'Home & Garden';
};

/**
 * Get more precise category for product filtering
 */
export const getPreciseCategory = (query: string): string => {
  const lowercaseQuery = query.toLowerCase();
  
  // Garden and planter specific categorization
  if (lowercaseQuery.includes('planter') || 
      lowercaseQuery.includes('garden pot') || 
      lowercaseQuery.includes('flower pot')) {
    return 'Garden Planters';
  }
  
  // Use the more general category mapping as a fallback
  return getImageCategory(query);
};
