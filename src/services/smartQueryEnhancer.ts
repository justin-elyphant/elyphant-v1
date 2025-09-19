/**
 * Smart Query Enhancer - Phase 1: Enhanced Query Strategy
 * Enhances API queries for better size representation and accuracy
 */

import { detectCategoryFromSearch } from "@/components/marketplace/utils/smartFilterDetection";

export interface QueryEnhancement {
  originalQuery: string;
  enhancedQueries: string[];
  searchStrategy: 'single' | 'multi-size' | 'category-aware';
  expectedSizeTypes: ('waist' | 'inseam' | 'shoes' | 'clothing')[];
}

// Apparel keywords that benefit from size-aware searches
const APPAREL_KEYWORDS = [
  'jeans', 'pants', 'trousers', 'denim', 'chinos', 'shorts',
  'shirt', 'blouse', 't-shirt', 'tee', 'polo', 'sweater',
  'jacket', 'coat', 'blazer', 'hoodie', 'dress', 'skirt',
  'shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats'
];

// Size ranges for strategic API calls
const SIZE_RANGES = {
  waist: {
    small: ['28', '29', '30', '31', '32'],
    medium: ['32', '33', '34', '35', '36'],
    large: ['36', '38', '40', '42', '44']
  },
  shoes: {
    women: ['6', '7', '8', '9', '10'],
    men: ['8', '9', '10', '11', '12']
  },
  clothing: {
    standard: ['S', 'M', 'L', 'XL'],
    extended: ['XS', 'XXL', '3XL']
  }
};

// Brand-specific size formatting patterns
const BRAND_SIZE_PATTERNS = {
  'levis': (sizes: string[]) => sizes.map(size => `${size}W`),
  'nike': (sizes: string[]) => sizes.map(size => `size ${size}`),
  'adidas': (sizes: string[]) => sizes.map(size => `US ${size}`),
  'gap': (sizes: string[]) => sizes.map(size => `${size} regular`),
  'old navy': (sizes: string[]) => sizes.map(size => `${size} fit`)
};

/**
 * Detects if a search query is apparel-related
 */
export function isApparelSearch(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return APPAREL_KEYWORDS.some(keyword => normalizedQuery.includes(keyword));
}

/**
 * Detects expected size types based on search query
 */
export function detectExpectedSizeTypes(query: string): ('waist' | 'inseam' | 'shoes' | 'clothing')[] {
  const normalizedQuery = query.toLowerCase();
  const types: ('waist' | 'inseam' | 'shoes' | 'clothing')[] = [];

  // Pants/jeans typically need waist and inseam
  if (normalizedQuery.match(/\b(jeans|pants|trousers|denim|chinos)\b/)) {
    types.push('waist', 'inseam');
  }

  // Shoes need shoe sizes
  if (normalizedQuery.match(/\b(shoes|sneakers|boots|sandals|heels|flats|footwear)\b/)) {
    types.push('shoes');
  }

  // Shirts, dresses, etc. need clothing sizes
  if (normalizedQuery.match(/\b(shirt|blouse|t-shirt|tee|dress|skirt|sweater|jacket|coat|hoodie)\b/)) {
    types.push('clothing');
  }

  return types.length > 0 ? types : ['clothing']; // Default to clothing if apparel but unclear
}

/**
 * Enhances a search query for better size representation
 */
export function enhanceQueryForSizes(query: string): QueryEnhancement {
  const detectedCategory = detectCategoryFromSearch(query);
  const isApparel = isApparelSearch(query);
  
  // For non-apparel searches, return original query
  if (!isApparel) {
    return {
      originalQuery: query,
      enhancedQueries: [query],
      searchStrategy: 'single',
      expectedSizeTypes: []
    };
  }

  const expectedSizeTypes = detectExpectedSizeTypes(query);
  const enhancedQueries: string[] = [query]; // Always include original

  // For jeans/pants - add size range queries
  if (query.toLowerCase().includes('jeans') || query.toLowerCase().includes('pants')) {
    // Add waist size variants
    enhancedQueries.push(`${query} 30W 32W 34W 36W`);
    enhancedQueries.push(`${query} waist 28 30 32 34 36 38`);
    
    // Add brand-specific enhancements if brand detected
    const brandMatch = query.match(/\b(levis?|gap|old navy|wrangler|lee)\b/i);
    if (brandMatch) {
      const brand = brandMatch[0].toLowerCase();
      if (BRAND_SIZE_PATTERNS[brand as keyof typeof BRAND_SIZE_PATTERNS]) {
        const formatter = BRAND_SIZE_PATTERNS[brand as keyof typeof BRAND_SIZE_PATTERNS];
        const formattedSizes = formatter(['30', '32', '34', '36']);
        enhancedQueries.push(`${query} ${formattedSizes.join(' ')}`);
      }
    }
  }

  // For shoes - add size range queries
  if (query.toLowerCase().match(/\b(shoes|sneakers|boots)\b/)) {
    enhancedQueries.push(`${query} size 8 9 10 11`);
    enhancedQueries.push(`${query} men's 9 10 11 women's 7 8 9`);
  }

  // For clothing - add size range queries
  if (expectedSizeTypes.includes('clothing')) {
    enhancedQueries.push(`${query} size S M L XL`);
    enhancedQueries.push(`${query} small medium large extra large`);
  }

  return {
    originalQuery: query,
    enhancedQueries,
    searchStrategy: enhancedQueries.length > 1 ? 'multi-size' : 'single',
    expectedSizeTypes
  };
}

/**
 * Creates size-aware search strategy for API calls
 */
export function createSizeAwareSearchStrategy(query: string, maxResults: number = 50): {
  queries: string[];
  resultsPerQuery: number;
  prioritizeOriginal: boolean;
} {
  const enhancement = enhanceQueryForSizes(query);
  
  if (enhancement.searchStrategy === 'single') {
    return {
      queries: [query],
      resultsPerQuery: maxResults,
      prioritizeOriginal: true
    };
  }

  // For multi-size strategy, distribute results across queries
  const numQueries = enhancement.enhancedQueries.length;
  const resultsPerQuery = Math.max(15, Math.floor(maxResults / numQueries));
  
  return {
    queries: enhancement.enhancedQueries,
    resultsPerQuery,
    prioritizeOriginal: true // Original query should get priority in results
  };
}

/**
 * Smart query for category-specific size distribution
 */
export function getCategoryOptimizedQuery(category: string, baseQuery: string): string {
  switch (category) {
    case 'clothing':
      return `${baseQuery} various sizes S M L XL different waist lengths`;
    case 'shoes':
      return `${baseQuery} multiple sizes men women different foot sizes`;
    case 'jeans':
      return `${baseQuery} 30W 32W 34W 36W 38W 30L 32L 34L various waist inseam`;
    default:
      return baseQuery;
  }
}