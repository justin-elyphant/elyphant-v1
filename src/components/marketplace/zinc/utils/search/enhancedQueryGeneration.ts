
/**
 * Enhanced search query generation with brand-first and age-aware logic
 */

import { generateBrandFirstQuery } from '@/utils/enhancedBrandUtils';
import { getAgeAppropriateSearchTerms } from '@/utils/enhancedAgeUtils';

export interface QueryGenerationContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  detectedBrands?: string[];
  ageGroup?: string;
  exactAge?: number;
}

/**
 * Generate enhanced search query with brand-first and age-aware logic
 */
export const generateEnhancedSearchQuery = (context: QueryGenerationContext): string => {
  const {
    recipient,
    relationship,
    occasion,
    interests = [],
    detectedBrands = [],
    ageGroup,
    budget
  } = context;
  
  // Use brand-first query generation if brands detected
  if (detectedBrands.length > 0) {
    return generateBrandFirstQuery(
      detectedBrands,
      interests,
      ageGroup,
      recipient,
      occasion
    );
  }
  
  // Enhanced non-brand query generation
  let query = "";
  
  // Start with interests if available
  if (interests.length > 0) {
    query = interests.join(" ");
  }
  
  // Add age-appropriate terms
  if (ageGroup) {
    const ageTerms = getAgeAppropriateSearchTerms(ageGroup);
    query += query ? ` ${ageTerms[0]}` : ageTerms[0];
  }
  
  // Add recipient info
  if (recipient && !ageGroup) {
    query += query ? ` for ${recipient}` : `gifts for ${recipient}`;
  } else if (relationship && !recipient && !ageGroup) {
    query += query ? ` for ${relationship}` : `gifts for ${relationship}`;
  }
  
  // Add occasion
  if (occasion) {
    query += ` ${occasion}`;
  }
  
  // Add budget constraint
  if (budget) {
    const [min, max] = budget;
    query += ` under $${max}`;
  }
  
  return query.trim() || "gifts";
};

/**
 * Generate multiple query variations for better results
 */
export const generateQueryVariations = (context: QueryGenerationContext): string[] => {
  const queries: string[] = [];
  
  // Primary enhanced query
  const primaryQuery = generateEnhancedSearchQuery(context);
  queries.push(primaryQuery);
  
  // Brand-specific variations if brands detected
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    for (const brand of context.detectedBrands) {
      // Brand + age group
      if (context.ageGroup) {
        queries.push(`${brand} for ${context.ageGroup}`);
      }
      
      // Brand + interests
      if (context.interests && context.interests.length > 0) {
        queries.push(`${brand} ${context.interests[0]}`);
      }
      
      // Brand + occasion
      if (context.occasion) {
        queries.push(`${brand} ${context.occasion} gifts`);
      }
    }
  }
  
  // Age-specific variations
  if (context.ageGroup && context.interests && context.interests.length > 0) {
    queries.push(`${context.interests[0]} for ${context.ageGroup}`);
  }
  
  // Remove duplicates and return top 3
  const uniqueQueries = [...new Set(queries)];
  return uniqueQueries.slice(0, 3);
};
