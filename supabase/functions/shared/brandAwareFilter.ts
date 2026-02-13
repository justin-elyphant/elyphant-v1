// ============================================================================
// BRAND-AWARE RELEVANCE FILTER - Reusable for cache-hit and Zinc API results
// ============================================================================

export const COMMON_BRANDS = [
  // Tech
  'sony', 'apple', 'samsung', 'bose', 'lg', 'microsoft', 
  'google', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'canon', 'nikon', 'fuji', 
  'panasonic', 'jbl', 'beats', 'logitech', 'razer', 'corsair', 'anker', 
  'belkin', 'nintendo', 'playstation', 'xbox',
  // Fashion - Apparel
  'nike', 'adidas', 'puma', 'reebok', 'new balance', 'under armour',
  "levi's", 'levis', 'gap', 'old navy', 'wrangler', 'lee', 'dockers',
  'north face', 'patagonia', 'columbia', 'carhartt',
  'ralph lauren', 'tommy hilfiger', 'calvin klein', 'gucci', 'prada', 'versace',
  'lululemon', 'athleta', 'champion', 'hanes', 'fruit of the loom',
  // Beauty & Personal Care
  'dove', 'nivea', 'olay', 'neutrogena', 'loreal', "l'oreal", 'maybelline',
  // Home & Kitchen
  'kitchenaid', 'cuisinart', 'instant pot', 'ninja', 'keurig', 'dyson', 'roomba', 'irobot'
];

// Brand aliases for spelling variations and common misspellings
export const BRAND_ALIASES: Record<string, string> = {
  // Levi's variations
  'levis': "levi's",
  'levi': "levi's",
  'levys': "levi's",
  'levis\'s': "levi's",
  // Under Armour variations
  'underarmour': 'under armour',
  'ua': 'under armour',
  // North Face variations
  'northface': 'north face',
  'the north face': 'north face',
  'tnf': 'north face',
  // Other common variations
  'tommyhilfiger': 'tommy hilfiger',
  'calvinklein': 'calvin klein',
  'ralphlauren': 'ralph lauren',
  'newbalance': 'new balance',
  'oldnavy': 'old navy',
  'fruitoftheloom': 'fruit of the loom',
  'instantpot': 'instant pot',
  'loreal': "l'oreal",
};

/**
 * Normalize a search term using brand aliases
 */
export const normalizeBrandTerm = (term: string): string => {
  const lowered = term.toLowerCase();
  return BRAND_ALIASES[lowered] || lowered;
};

/**
 * Calculate relevance score for a product based on search query
 * Enhanced with model number detection for apparel searches
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
  
  // Detect model numbers in search (3-4 digit numbers like "512", "501", "505")
  const searchModelNumbers = searchTerms.filter(t => /^\d{3,4}$/.test(t));
  
  for (const term of searchTerms) {
    const normalizedTerm = normalizeBrandTerm(term);
    const isModelNumber = /^\d{3,4}$/.test(term);
    
    // Brand match = highest priority (100 points)
    if (brand.includes(term) || brand.includes(normalizedTerm)) score += 100;
    
    // Title match scoring
    if (title.includes(term) || title.includes(normalizedTerm)) {
      if (isModelNumber) {
        // BOOST: Model numbers get 150 points (vs 50 for generic terms)
        // This ensures "512" in title ranks higher than generic "jeans" matches
        score += 150;
      } else {
        score += 50;
      }
    }
    
    // Category match = decent (20 points)
    if (category.includes(term)) score += 20;
  }
  
  // Bonus for matching ALL search terms
  const allMatch = searchTerms.every(t => {
    const nt = normalizeBrandTerm(t);
    return title.includes(t) || title.includes(nt) || 
           brand.includes(t) || brand.includes(nt) || 
           category.includes(t);
  });
  if (allMatch) score += 200;
  
  // PENALTY: Wrong model numbers
  // If searching for "512", heavily penalize products with different model numbers (537, 505, etc.)
  if (searchModelNumbers.length > 0) {
    const titleNumbers = title.match(/\b\d{3,4}\b/g) || [];
    const hasSearchModel = searchModelNumbers.some(m => titleNumbers.includes(m));
    const hasWrongModel = titleNumbers.some(num => !searchModelNumbers.includes(num));
    
    if (hasWrongModel && !hasSearchModel) {
      // Product has a model number that doesn't match search - heavy penalty
      score -= 100;
      console.log(`[Relevance] Penalized wrong model: "${title}" has [${titleNumbers.join(',')}] but searching [${searchModelNumbers.join(',')}]`);
    }
  }
  
  // If searching for a specific brand, penalize products that don't match it
  if (searchBrands.length > 0) {
    const productBrandMatchesSearch = searchBrands.some(searchBrand => {
      const normalizedSearchBrand = normalizeBrandTerm(searchBrand);
      return brand.includes(searchBrand) || brand.includes(normalizedSearchBrand) ||
             title.includes(searchBrand) || title.includes(normalizedSearchBrand);
    });
    if (!productBrandMatchesSearch) {
      score -= 150; // Heavy penalty for brand mismatch
    }
  }
  
  // PRODUCT-TYPE ENFORCEMENT: For multi-word searches, penalize results missing
  // the product-type keyword (e.g., "socks" in "adidas mens socks")
  const GENERIC_MODIFIERS = [
    "mens", "womens", "women", "men", "kids", "boys", "girls", "unisex",
    "adult", "junior", "youth", "small", "medium", "large", "new", "best",
    "top", "rated", "popular", "cheap", "premium", "luxury", "pro"
  ];
  
  if (searchTerms.length >= 2) {
    // Find product-type keywords: non-brand, non-generic terms
    const productTypeTerms = searchTerms.filter(t => {
      const nt = normalizeBrandTerm(t);
      const isBrand = searchBrands.includes(t) || searchBrands.includes(nt) ||
                      COMMON_BRANDS.includes(t) || COMMON_BRANDS.includes(nt);
      const isGeneric = GENERIC_MODIFIERS.includes(t);
      const isModelNumber = /^\d{3,4}$/.test(t);
      return !isBrand && !isGeneric && !isModelNumber && t.length >= 3;
    });
    
    if (productTypeTerms.length > 0) {
      const hasProductTypeMatch = productTypeTerms.some(pt => {
        const nt = normalizeBrandTerm(pt);
        return title.includes(pt) || title.includes(nt) || 
               category.includes(pt) || category.includes(nt);
      });
      
      if (!hasProductTypeMatch) {
        score -= 200; // Heavy penalty: product doesn't match what the user is looking for
        console.log(`[Relevance] Product-type penalty: "${title.substring(0, 50)}" missing [${productTypeTerms.join(',')}]`);
      }
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
  normalizedQuery: string;
} => {
  if (!query) {
    return { searchTerms: [], searchBrands: [], hasBrandSearch: false, normalizedQuery: '' };
  }
  
  // Split and filter terms
  const rawTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length >= 3);
  
  // Normalize terms using brand aliases
  const searchTerms = rawTerms.map(term => normalizeBrandTerm(term));
  
  // Check for brand matches (including normalized versions)
  const searchBrands = searchTerms.filter(term => 
    COMMON_BRANDS.includes(term) || 
    COMMON_BRANDS.some(brand => brand.includes(term) || term.includes(brand))
  );
  const hasBrandSearch = searchBrands.length > 0;
  
  // Create normalized query for API calls
  const normalizedQuery = searchTerms.join(' ');
  
  console.log(`🔍 Brand parse: "${query}" → terms: [${searchTerms.join(', ')}], brands: [${searchBrands.join(', ')}], normalized: "${normalizedQuery}"`);
  
  return { searchTerms, searchBrands, hasBrandSearch, normalizedQuery };
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
