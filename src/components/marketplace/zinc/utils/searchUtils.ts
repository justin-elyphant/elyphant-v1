
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';

/**
 * Finds products that match the search query
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Check for exact matches in our specific products first
  for (const key in specificProducts) {
    if (lowercaseQuery.includes(key)) {
      return specificProducts[key];
    }
  }
  
  // Then check for partial matches in specific product keys
  for (const key in specificProducts) {
    const keyTerms = key.split(' ');
    const queryTerms = lowercaseQuery.split(' ');
    
    // Check if any term in the query matches any term in a specific product key
    const hasMatch = keyTerms.some(keyTerm => 
      queryTerms.some(queryTerm => 
        keyTerm.includes(queryTerm) || queryTerm.includes(keyTerm)
      )
    );
    
    if (hasMatch) {
      return specificProducts[key];
    }
  }
  
  // Filter products based on query
  let results = allProducts.filter(product => 
    product.title.toLowerCase().includes(lowercaseQuery) || 
    (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
    (product.category && product.category.toLowerCase().includes(lowercaseQuery)) ||
    (product.brand && product.brand.toLowerCase().includes(lowercaseQuery))
  );
  
  // If no results, return some default items
  if (results.length === 0) {
    results = allProducts.slice(0, 3);
  }
  
  return results;
};
