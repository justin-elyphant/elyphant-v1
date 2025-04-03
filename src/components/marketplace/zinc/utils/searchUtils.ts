
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';

/**
 * Finds products that match the search query
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Normalize query - support both "Nike Shoes" and "nike shoes"
  const normalizedQuery = lowercaseQuery.trim();
  
  console.log(`SearchUtils: Searching for "${normalizedQuery}"`);
  
  // Direct matching for "nike shoes" - prioritize this common search
  if (normalizedQuery === "nike shoes" || 
      normalizedQuery === "nike shoe" || 
      (normalizedQuery.includes("nike") && normalizedQuery.includes("shoe"))) {
    console.log(`SearchUtils: Found special match for Nike Shoes`);
    return specificProducts["nike shoes"] || [];
  }
  
  // Check for exact matches in our specific products first
  for (const key in specificProducts) {
    if (key === normalizedQuery) {
      console.log(`SearchUtils: Found exact match for "${normalizedQuery}" in specific products`);
      return specificProducts[key];
    }
  }
  
  // Check for partial matches that might be close but not exact
  for (const key in specificProducts) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      console.log(`SearchUtils: Found partial match for "${normalizedQuery}" in specific products key "${key}"`);
      return specificProducts[key];
    }
  }
  
  // Check word by word
  const queryTerms = normalizedQuery.split(' ');
  for (const key in specificProducts) {
    const keyTerms = key.split(' ');
    
    // Check if enough terms match between the query and the key
    const matchingTerms = queryTerms.filter(term => 
      keyTerms.some(keyTerm => keyTerm.includes(term) || term.includes(keyTerm))
    );
    
    if (matchingTerms.length >= Math.min(2, queryTerms.length)) {
      console.log(`SearchUtils: Found term match for "${normalizedQuery}" in specific products key "${key}"`);
      return specificProducts[key];
    }
  }
  
  // Filter products based on query
  let results = allProducts.filter(product => 
    product.title.toLowerCase().includes(normalizedQuery) || 
    (product.description && product.description.toLowerCase().includes(normalizedQuery)) ||
    (product.category && product.category.toLowerCase().includes(normalizedQuery)) ||
    (product.brand && product.brand && product.brand.toLowerCase().includes(normalizedQuery))
  );
  
  // Check for brand-specific searches (like "Nike")
  if (results.length === 0 && normalizedQuery.includes('nike')) {
    console.log(`SearchUtils: Using fallback for Nike-related search`);
    return specificProducts['nike shoes'] || [];
  }
  
  // If no results, return some default items
  if (results.length === 0) {
    console.log(`SearchUtils: No matches found, returning default products`);
    results = allProducts.slice(0, 3);
  }
  
  console.log(`SearchUtils: Returning ${results.length} results`);
  return results;
};
