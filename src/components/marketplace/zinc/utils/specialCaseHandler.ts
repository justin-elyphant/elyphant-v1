
import { ZincProduct } from '../types';
import { handleSpecialCases, createResultsForMappedTerm } from './specialCaseHandler';

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
