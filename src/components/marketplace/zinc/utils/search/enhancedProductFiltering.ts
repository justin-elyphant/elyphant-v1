
/**
 * Enhanced product filtering with brand-first and age-aware logic
 */

import { ZincProduct } from '../../types';
import { detectBrandsInMessage, calculateBrandRelevanceScore } from '@/utils/enhancedBrandUtils';
import { extractAgeFromMessage } from '@/utils/enhancedAgeUtils';

export interface EnhancedFilterOptions {
  detectedBrands: string[];
  interests: string[];
  ageGroup?: string;
  prioritizeBrands: boolean;
}

/**
 * Filter and sort products with brand-first logic
 */
export const filterAndSortProductsBrandFirst = (
  products: ZincProduct[],
  query: string,
  options: EnhancedFilterOptions
): ZincProduct[] => {
  if (!products.length) return products;
  
  // Calculate relevance scores for each product
  const scoredProducts = products.map(product => {
    const brandScore = calculateBrandRelevanceScore(
      product.title || '',
      product.brand,
      options.detectedBrands,
      options.interests,
      options.ageGroup
    );
    
    // Basic relevance score from existing logic
    const titleMatch = (product.title || '').toLowerCase().includes(query.toLowerCase()) ? 20 : 0;
    const categoryMatch = (product.category || '').toLowerCase().includes(query.toLowerCase()) ? 10 : 0;
    
    const totalScore = brandScore + titleMatch + categoryMatch;
    
    return {
      ...product,
      relevanceScore: totalScore,
      hasBrandMatch: options.detectedBrands.some(brand => 
        (product.brand || '').toLowerCase().includes(brand.toLowerCase()) ||
        (product.title || '').toLowerCase().includes(brand.toLowerCase())
      )
    };
  });
  
  // Sort products: Brand matches first, then by relevance score
  return scoredProducts.sort((a, b) => {
    // If prioritizing brands, brand matches come first
    if (options.prioritizeBrands) {
      if (a.hasBrandMatch && !b.hasBrandMatch) return -1;
      if (!a.hasBrandMatch && b.hasBrandMatch) return 1;
    }
    
    // Then sort by total relevance score
    return b.relevanceScore - a.relevanceScore;
  });
};

/**
 * Generate enhanced search context from user message
 */
export const generateEnhancedSearchContext = (message: string) => {
  const detectedBrands = detectBrandsInMessage(message);
  const ageInfo = extractAgeFromMessage(message);
  
  // Extract interests from message (enhanced)
  const interests: string[] = [];
  const interestPatterns = [
    /(?:likes?|loves?|enjoys?|interested in)\s+([^,.!?]+)/gi,
    /(?:into|really into)\s+([^,.!?]+)/gi,
    /(building|blocks|legos?|toys?|games?|books?|sports?|music|art|science)/gi
  ];
  
  for (const pattern of interestPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const interest = match[1].trim().toLowerCase();
      if (interest && !interests.includes(interest)) {
        interests.push(interest);
      }
    }
  }
  
  return {
    detectedBrands: detectedBrands.map(b => b.brand),
    brandMatches: detectedBrands,
    ageInfo,
    interests,
    prioritizeBrands: detectedBrands.length > 0
  };
};
