
/**
 * Enhanced search query generator for Nicole's AI conversations
 * Preserves Enhanced Zinc API System compatibility with "best selling" optimization
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
 * Generate enhanced search query with brand-first logic and "best selling" optimization
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
 * Generate brand-focused search query with "best selling" optimization
 */
const generateBrandBasedQuery = (context: SearchContext): string => {
  const { detectedBrands = [], interests = [], exactAge, occasion } = context;
  
  let query = `best selling ${detectedBrands[0]}`; // Primary brand with "best selling"
  
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
 * Generate interest-focused search query with "best selling" optimization
 */
const generateInterestBasedQuery = (context: SearchContext): string => {
  const { interests = [], recipient, relationship, exactAge, occasion, budget } = context;
  
  let query = `best selling ${interests[0]}`; // Primary interest with "best selling"
  
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
 * Generate demographic-focused search query with "best selling" optimization
 */
const generateDemographicBasedQuery = (context: SearchContext): string => {
  const { recipient, relationship, exactAge, occasion, budget } = context;
  
  let query = "best selling gifts"; // Start with "best selling"
  
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
 * Generate multiple query variations for better search coverage with "best selling" optimization
 */
export const generateQueryVariations = (context: SearchContext): string[] => {
  const variations: string[] = [];
  
  // Primary query
  variations.push(generateEnhancedSearchQuery(context));
  
  // Brand variations with "best selling"
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    context.detectedBrands.forEach(brand => {
      if (context.interests && context.interests.length > 0) {
        variations.push(`best selling ${brand} ${context.interests[0]}`);
      }
      if (context.occasion) {
        variations.push(`best selling ${brand} ${context.occasion} gifts`);
      }
    });
  }
  
  // Interest + demographic variations with "best selling"
  if (context.interests && context.interests.length > 0) {
    const interest = context.interests[0];
    if (context.exactAge) {
      const ageTerms = getAgeAppropriateTerms(context.exactAge);
      variations.push(`best selling ${interest} for ${ageTerms}`);
    }
  }
  
  // Remove duplicates and return top 3
  return [...new Set(variations)].slice(0, 3);
};
