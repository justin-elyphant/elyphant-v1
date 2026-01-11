// ============================================================================
// BRAND-AWARE RELEVANCE FILTER - Reusable for cache-hit and Zinc API results
// ============================================================================

export const COMMON_BRANDS = [
  'sony', 'apple', 'samsung', 'bose', 'nike', 'adidas', 'lg', 'microsoft', 
  'google', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'canon', 'nikon', 'fuji', 
  'panasonic', 'jbl', 'beats', 'logitech', 'razer', 'corsair', 'anker', 
  'belkin', 'nintendo', 'playstation', 'xbox'
];

/**
 * Calculate relevance score for a product based on search query
 */
export const calculateRelevanceScore = (
  product: any, 
  searchTerms: string[], 
  searchBrands: string[]
): number => {
  let score = 0;
  const title = (product.title || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  
  for (const term of searchTerms) {
    // Brand match = highest priority (100 points)
    if (brand.includes(term)) score += 100;
    // Title match = good (50 points)
    if (title.includes(term)) score += 50;
    // Category match = decent (20 points)
    if (category.includes(term)) score += 20;
  }
  
  // Bonus for matching ALL search terms
  const allMatch = searchTerms.every(t => 
    title.includes(t) || brand.includes(t) || category.includes(t)
  );
  if (allMatch) score += 200;
  
  // If searching for a specific brand, penalize products that don't match it
  if (searchBrands.length > 0) {
    const productBrandMatchesSearch = searchBrands.some(searchBrand => 
      brand.includes(searchBrand) || title.includes(searchBrand)
    );
    if (!productBrandMatchesSearch) {
      score -= 150; // Heavy penalty for brand mismatch
    }
  }
  
  return score;
};

/**
 * Parse search query into terms and detect brand searches
 */
export const parseSearchQuery = (query: string): { 
  searchTerms: string[]; 
  searchBrands: string[]; 
  hasBrandSearch: boolean;
} => {
  if (!query) {
    return { searchTerms: [], searchBrands: [], hasBrandSearch: false };
  }
  
  const searchTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length >= 3);
  
  const searchBrands = searchTerms.filter(term => COMMON_BRANDS.includes(term));
  const hasBrandSearch = searchBrands.length > 0;
  
  return { searchTerms, searchBrands, hasBrandSearch };
};

/**
 * Apply brand-aware relevance filtering to products
 * Returns filtered and sorted products based on relevance to search query
 */
export const applyBrandAwareFilter = (products: any[], query: string): any[] => {
  if (!query || !products || products.length === 0) return products;
  
  const { searchTerms, searchBrands, hasBrandSearch } = parseSearchQuery(query);
  
  if (searchTerms.length === 0) return products;
  
  // Score all products
  const scoredResults = products.map((product: any) => ({
    product,
    relevanceScore: calculateRelevanceScore(product, searchTerms, searchBrands)
  }));
  
  // Filter out low-relevance products
  // For multi-word non-brand searches, require higher score (products must match multiple terms)
  const isMultiWordSearch = searchTerms.length >= 2;
  const minScore = hasBrandSearch ? 100 : (isMultiWordSearch ? 150 : 50);
  const relevantResults = scoredResults.filter(r => r.relevanceScore >= minScore);
  
  console.log(`🎯 Brand-aware filter: minScore=${minScore} (multi-word: ${isMultiWordSearch}, brand: ${hasBrandSearch})`);
  
  // Sort by relevance score (highest first)
  relevantResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  const filteredProducts = relevantResults.map(r => r.product);
  
  console.log(`🎯 Brand-aware filter: ${products.length} → ${filteredProducts.length} products (brand search: ${hasBrandSearch}, brands: ${searchBrands.join(',')})`);
  
  return filteredProducts;
};

/**
 * Check if brand filter would remove all products (for Zinc fallback decision)
 */
export const wouldBrandFilterRemoveAll = (products: any[], query: string): boolean => {
  if (!query || !products || products.length === 0) return false;
  
  const filtered = applyBrandAwareFilter(products, query);
  return filtered.length === 0 && products.length > 0;
};
