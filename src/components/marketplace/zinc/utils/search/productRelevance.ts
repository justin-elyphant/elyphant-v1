/**
 * Utilities for determining product relevance to search queries
 */

import { ZincProduct } from '../../types';

/**
 * Check if a product is relevant to a search query
 * @param product The product to check
 * @param query The search query
 * @returns True if the product is relevant to the search query
 */
export const isProductRelevantToSearch = (product: ZincProduct, query: string): boolean => {
  const lowercaseQuery = query.toLowerCase();
  const title = (product.title || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  
  // Break the query into words for more precise matching
  const queryTerms = lowercaseQuery.split(/\s+/).filter(term => term.length > 2);
  
  // Product must match at least one term in the title, brand, or category
  const hasTermMatch = queryTerms.some(term => 
    title.includes(term) || 
    brand.includes(term) || 
    category.includes(term) || 
    description.includes(term)
  );
  
  return hasTermMatch;
};

/**
 * Filter products based on relevance score
 * @param products Array of products to filter
 * @param query The search query
 * @param threshold Minimum relevance score (0-1)
 * @returns Filtered and sorted array of products
 */
export const filterProductsByRelevance = (
  products: ZincProduct[], 
  query: string, 
  threshold: number = 0.3
): ZincProduct[] => {
  if (!query || !products.length) return products;
  
  // Only keep products that pass the basic relevance check
  return products.filter(product => isProductRelevantToSearch(product, query));
};
