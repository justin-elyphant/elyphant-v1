
/**
 * Enhanced search query generator for Nicole's AI conversations
 * Preserves Enhanced Zinc API System compatibility
 */

export interface SearchContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  exactAge?: number;
  interests?: string[];
  budget?: [number, number];
  detectedBrands?: string[];
}

/**
 * Generate enhanced search query with brand-first logic
 */
export const generateEnhancedSearchQuery = (context: SearchContext): string => {
  const {
    recipient,
    relationship,
    occasion,
    interests = [],
    detectedBrands = [],
    budget,
    exactAge
  } = context;
  
  // Brand-first approach for better results
  if (detectedBrands.length > 0) {
    return generateBrandBasedQuery(context);
  }
  
  // Interest-first approach
  if (interests.length > 0) {
    return generateInterestBasedQuery(context);
  }
  
  // Demographic-first approach
  return generateDemographicBasedQuery(context);
};

/**
 * Generate brand-focused search query
 */
const generateBrandBasedQuery = (context: SearchContext): string => {
  const { detectedBrands = [], interests = [], exactAge, occasion } = context;
  
  let query = detectedBrands[0]; // Primary brand
  
  // Add age-appropriate terms
  if (exactAge) {
    const ageTerms = getAgeAppropriateTerms(exactAge);
    query += ` ${ageTerms}`;
  }
  
  // Add primary interest
  if (interests.length > 0) {
    query += ` ${interests[0]}`;
  }
  
  // Add occasion context
  if (occasion) {
    query += ` ${occasion}`;
  }
  
  return query.trim();
};

/**
 * Generate interest-focused search query
 */
const generateInterestBasedQuery = (context: SearchContext): string => {
  const { interests = [], recipient, relationship, exactAge, occasion, budget } = context;
  
  let query = interests[0]; // Primary interest
  
  // Add secondary interest if available
  if (interests.length > 1) {
    query += ` ${interests[1]}`;
  }
  
  // Add demographic context
  if (exactAge) {
    const ageTerms = getAgeAppropriateTerms(exactAge);
    query += ` for ${ageTerms}`;
  } else if (recipient) {
    query += ` for ${recipient}`;
  } else if (relationship) {
    query += ` for ${relationship}`;
  }
  
  // Add occasion
  if (occasion) {
    query += ` ${occasion}`;
  }
  
  // Add budget constraint
  if (budget) {
    const [, max] = budget;
    query += ` under $${max}`;
  }
  
  return query.trim();
};

/**
 * Generate demographic-focused search query
 */
const generateDemographicBasedQuery = (context: SearchContext): string => {
  const { recipient, relationship, exactAge, occasion, budget } = context;
  
  let query = "gifts";
  
  // Add recipient context
  if (exactAge) {
    const ageTerms = getAgeAppropriateTerms(exactAge);
    query += ` for ${ageTerms}`;
  } else if (recipient) {
    query += ` for ${recipient}`;
  } else if (relationship) {
    query += ` for ${relationship}`;
  }
  
  // Add occasion
  if (occasion) {
    query += ` ${occasion}`;
  }
  
  // Add budget constraint
  if (budget) {
    const [, max] = budget;
    query += ` under $${max}`;
  }
  
  return query.trim();
};

/**
 * Get age-appropriate search terms
 */
const getAgeAppropriateTerms = (age: number): string => {
  if (age <= 5) return "toddlers";
  if (age <= 12) return "kids";
  if (age <= 17) return "teens";
  if (age <= 25) return "young adults";
  if (age <= 40) return "adults";
  if (age <= 60) return "middle aged";
  return "seniors";
};

/**
 * Generate multiple query variations for better search coverage
 */
export const generateQueryVariations = (context: SearchContext): string[] => {
  const variations: string[] = [];
  
  // Primary query
  variations.push(generateEnhancedSearchQuery(context));
  
  // Brand variations
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    context.detectedBrands.forEach(brand => {
      if (context.interests && context.interests.length > 0) {
        variations.push(`${brand} ${context.interests[0]}`);
      }
      if (context.occasion) {
        variations.push(`${brand} ${context.occasion} gifts`);
      }
    });
  }
  
  // Interest + demographic variations
  if (context.interests && context.interests.length > 0) {
    const interest = context.interests[0];
    if (context.exactAge) {
      const ageTerms = getAgeAppropriateTerms(context.exactAge);
      variations.push(`${interest} for ${ageTerms}`);
    }
  }
  
  // Remove duplicates and return top 3
  return [...new Set(variations)].slice(0, 3);
};
