
/**
 * Search query validation and enhancement utilities
 */

/**
 * Validate and normalize search query
 */
export const validateSearchQuery = (query: string): string | null => {
  if (!query || typeof query !== 'string') {
    return null;
  }
  
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    return null;
  }
  
  return trimmed;
};

/**
 * Enhance search query with category hints and brand-specific logic
 */
export const enhanceSearchQuery = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  // Brand-specific enhancements
  if (lowerQuery.includes('apple') && !lowerQuery.includes('fruit') && !lowerQuery.includes('food')) {
    return "Apple iPhone iPad MacBook AirPods Apple Watch electronics technology";
  }
  
  if (lowerQuery.includes('samsung')) {
    return "Samsung Galaxy phone tablet electronics technology";
  }
  
  if (lowerQuery.includes('sony')) {
    return "Sony electronics headphones camera PlayStation technology";
  }
  
  if (lowerQuery.includes('nike')) {
    return "Nike shoes sneakers athletic wear sports";
  }
  
  if (lowerQuery.includes('adidas')) {
    return "Adidas shoes sneakers athletic wear sports";
  }
  
  // Category-based enhancements
  if (lowerQuery.includes('gift') || lowerQuery.includes('present')) {
    return `${query} popular bestseller`;
  }
  
  if (lowerQuery.includes('dallas cowboys')) {
    return "Dallas Cowboys NFL merchandise jersey hat";
  }
  
  if (lowerQuery.includes('made in')) {
    return "Made In cookware kitchen utensils";
  }
  
  // Default enhancement
  return query;
};

/**
 * Correct common spelling mistakes in search queries
 */
export const correctSearchQuery = (query: string): string => {
  const corrections: Record<string, string> = {
    'iphone': 'iPhone',
    'ipad': 'iPad',
    'macbook': 'MacBook',
    'airpods': 'AirPods',
    'samsung': 'Samsung',
    'nike': 'Nike',
    'adidas': 'Adidas'
  };
  
  let corrected = query;
  Object.entries(corrections).forEach(([wrong, right]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    corrected = corrected.replace(regex, right);
  });
  
  return corrected;
};

/**
 * Get special Padres hat query if applicable
 */
export const getPadresHatQuery = (query: string): string | null => {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('padres') && (lowerQuery.includes('hat') || lowerQuery.includes('cap'))) {
    return "San Diego Padres baseball cap hat MLB";
  }
  return null;
};
