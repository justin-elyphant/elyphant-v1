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
 * Basic plural stemming for search term matching.
 * Converts common English plurals to their singular form.
 */
export const stemWord = (word: string): string => {
  const w = word.toLowerCase();
  // ves → f (knives→knife, wolves→wolf)
  if (w.endsWith('ves')) return w.slice(0, -3) + 'f';
  // ies → y (batteries→battery)
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  // ses, xes, zes, ches, shes → drop "es"
  if (w.endsWith('ses') || w.endsWith('xes') || w.endsWith('zes') || w.endsWith('ches') || w.endsWith('shes'))
    return w.slice(0, -2);
  // s (but not ss) → drop "s"
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
};

/**
 * Levenshtein distance for fuzzy/typo-tolerant matching.
 * Returns edit distance between two strings.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
};

/**
 * Fuzzy match: returns true if two words are within edit distance 2
 * Only applies to words of length >= 4 to avoid false positives on short words
 */
export const fuzzyMatch = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  // Allow distance 1 for short words (4-5 chars), distance 2 for longer
  const maxDist = Math.min(a.length, b.length) <= 5 ? 1 : 2;
  return levenshteinDistance(a, b) <= maxDist;
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
  const description = (product.product_description || product.description || product.metadata?.product_description || '').toLowerCase();
  
  // Detect model numbers in search (3-4 digit numbers like "512", "501", "505")
  const searchModelNumbers = searchTerms.filter(t => /^\d{3,4}$/.test(t));
  
  // Helper: check if a term matches in a text field (exact, stem, or fuzzy)
  const matchesField = (term: string, field: string): 'exact' | 'stem' | 'fuzzy' | false => {
    const normalizedTerm = normalizeBrandTerm(term);
    const stemmedTerm = stemWord(term);
    if (field.includes(term) || field.includes(normalizedTerm)) return 'exact';
    if (field.split(/\s+/).some(w => stemWord(w) === stemmedTerm)) return 'stem';
    if (field.split(/\s+/).some(w => fuzzyMatch(w, term) || fuzzyMatch(stemWord(w), stemmedTerm))) return 'fuzzy';
    return false;
  };
  
  for (const term of searchTerms) {
    const normalizedTerm = normalizeBrandTerm(term);
    const isModelNumber = /^\d{3,4}$/.test(term);
    
    // Brand match = highest priority (100 points)
    if (brand.includes(term) || brand.includes(normalizedTerm)) score += 100;
    
    // Title match scoring (includes stemmed and fuzzy matching)
    const titleMatch = matchesField(term, title);
    if (titleMatch) {
      if (isModelNumber) {
        score += 150;
      } else {
        score += titleMatch === 'fuzzy' ? 20 : 50;
      }
    }
    
    // Category match (20 points, 10 for fuzzy)
    const catMatch = matchesField(term, category);
    if (catMatch) score += catMatch === 'fuzzy' ? 10 : 20;
    
    // Description match (15 points, 8 for fuzzy) — catches conceptual searches
    const descMatch = matchesField(term, description);
    if (descMatch) score += descMatch === 'fuzzy' ? 8 : 15;
  }
  
  // Bonus for matching ALL search terms (across all fields)
  const allMatch = searchTerms.every(t => {
    return matchesField(t, title) || matchesField(t, brand) || matchesField(t, category) || matchesField(t, description);
  });
  if (allMatch) score += 200;
  
  // PENALTY: Wrong model numbers
  if (searchModelNumbers.length > 0) {
    const titleNumbers = title.match(/\b\d{3,4}\b/g) || [];
    const hasSearchModel = searchModelNumbers.some(m => titleNumbers.includes(m));
    const hasWrongModel = titleNumbers.some(num => !searchModelNumbers.includes(num));
    
    if (hasWrongModel && !hasSearchModel) {
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
      score -= 150;
    }
  }
  
  // PRODUCT-TYPE ENFORCEMENT: For multi-word searches, penalize results missing
  // the product-type keyword — reduced from -200 to -100 to allow conceptual matches
  const GENERIC_MODIFIERS = [
    "mens", "womens", "women", "men", "kids", "boys", "girls", "unisex",
    "adult", "junior", "youth", "small", "medium", "large", "new", "best",
    "top", "rated", "popular", "cheap", "premium", "luxury", "pro"
  ];
  
  if (searchTerms.length >= 2) {
    const productTypeTerms = searchTerms.filter(t => {
      const nt = normalizeBrandTerm(t);
      const isBrand = searchBrands.includes(t) || searchBrands.includes(nt) ||
                      COMMON_BRANDS.includes(t) || COMMON_BRANDS.includes(nt);
      const isGeneric = GENERIC_MODIFIERS.includes(t);
      const isModelNumber = /^\d{3,4}$/.test(t);
      return !isBrand && !isGeneric && !isModelNumber && t.length >= 3;
    });
    
    if (productTypeTerms.length > 0) {
      // Check across title, category, AND description (+ fuzzy)
      const hasProductTypeMatch = productTypeTerms.some(pt => {
        return matchesField(pt, title) || matchesField(pt, category) || matchesField(pt, description);
      });
      
      if (!hasProductTypeMatch) {
        score -= 100; // Reduced from -200: still penalizes but doesn't kill conceptual matches
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
