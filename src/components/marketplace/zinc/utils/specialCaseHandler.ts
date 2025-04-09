
import { ZincProduct } from '../types';

/**
 * Get special case products for specific search terms
 */
export const getSpecialCaseProducts = async (query: string): Promise<ZincProduct[] | null> => {
  // First check direct special cases
  const specialCaseResults = handleSpecialCases(query);
  if (specialCaseResults) {
    return specialCaseResults;
  }
  
  // Check if we have a mapped term
  const mappedTerm = getMappedSearchTerm(query);
  if (mappedTerm && mappedTerm !== query) {
    console.log(`Using mapped search term: "${query}" -> "${mappedTerm}"`);
    return createResultsForMappedTerm(mappedTerm);
  }
  
  return null;
};

/**
 * Maps common search terms to more specific ones
 */
const getMappedSearchTerm = (query: string): string | null => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Common search term mappings
  const mappings: Record<string, string> = {
    'phone': 'smartphone',
    'computer': 'laptop computer',
    'tv': 'television',
    'laptop': 'laptop computer',
    'headphone': 'headphones',
    'watch': 'wristwatch',
    'earbuds': 'wireless earbuds',
    'earphone': 'earphones',
    'speaker': 'bluetooth speaker',
    'camera': 'digital camera',
    'tablet': 'tablet computer',
    'game': 'video game',
    'console': 'gaming console',
    'football': 'american football',
    'soccer': 'soccer ball',
    'cowboys': 'dallas cowboys',
  };
  
  // Check if we have an exact match
  if (mappings[lowercaseQuery]) {
    return mappings[lowercaseQuery];
  }
  
  // Check if query contains any of our mappable terms
  for (const [key, value] of Object.entries(mappings)) {
    if (lowercaseQuery.includes(key)) {
      return value;
    }
  }
  
  return null;
};

/**
 * Handle special case search queries that need custom results
 */
export const handleSpecialCases = (query: string): ZincProduct[] | null => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Add special case handling here if needed
  // For now, return null to indicate no special handling
  return null;
};

/**
 * Create mock results for mapped search terms
 */
export const createResultsForMappedTerm = (mappedTerm: string): ZincProduct[] => {
  // Generate mock products for the mapped term
  // This is a simplified implementation
  const mockProducts: ZincProduct[] = [
    {
      product_id: `MAPPED-${mappedTerm}-1`,
      title: `Premium ${mappedTerm} - Model X`,
      price: 99.99,
      image: `https://picsum.photos/seed/${mappedTerm}/300/300`,
      description: `High-quality ${mappedTerm} with premium features`,
      brand: 'Brand Name',
      category: mappedTerm.charAt(0).toUpperCase() + mappedTerm.slice(1),
      retailer: 'Amazon via Zinc',
      rating: 4.5,
      review_count: 120
    },
    {
      product_id: `MAPPED-${mappedTerm}-2`,
      title: `Budget-friendly ${mappedTerm}`,
      price: 49.99,
      image: `https://picsum.photos/seed/${mappedTerm}2/300/300`,
      description: `Affordable ${mappedTerm} for everyday use`,
      brand: 'Value Brand',
      category: mappedTerm.charAt(0).toUpperCase() + mappedTerm.slice(1),
      retailer: 'Amazon via Zinc',
      rating: 4.2,
      review_count: 85
    }
  ];
  
  return mockProducts;
};
