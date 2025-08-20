/**
 * Multi-interest search utility for diversified product results
 */

import { ZincProduct } from '../../types';
import { searchProducts } from '../../zincService';
import { applyBrandDiversityFilter } from './brandDiversityFilter';

export interface MultiInterestSearchOptions {
  maxProductsPerInterest: number;
  maxProductsPerBrand: number;
  enableBrandDiversity: boolean;
  targetTotalResults: number;
}

export interface MultiInterestSearchResult {
  products: ZincProduct[];
  searchBreakdown: { [interest: string]: number };
  brandDistribution: { [brand: string]: number };
  totalResults: number;
}

// Extended product type for internal tracking
interface EnhancedZincProduct extends ZincProduct {
  search_source?: string;
}

/**
 * Search multiple interests and intelligently interleave results for diversity
 */
export const searchMultipleInterests = async (
  interests: string[],
  options: MultiInterestSearchOptions = {
    maxProductsPerInterest: 8,
    maxProductsPerBrand: 2,
    enableBrandDiversity: true,
    targetTotalResults: 24
  }
): Promise<MultiInterestSearchResult> => {
  if (!interests.length) {
    return {
      products: [],
      searchBreakdown: {},
      brandDistribution: {},
      totalResults: 0
    };
  }

  console.log(`[Multi-Interest Search] Searching ${interests.length} interests:`, interests);

  try {
    // Perform separate searches for each interest
    const interestResults: { [interest: string]: ZincProduct[] } = {};
    const searchPromises = interests.map(async (interest) => {
      const results = await searchProducts(interest, "12"); // Get more per interest to ensure diversity
      interestResults[interest] = results;
      return { interest, results };
    });

    await Promise.all(searchPromises);

    // Apply round-robin interleaving to mix results fairly
    const interleavedProducts = roundRobinInterleave(interestResults, options.maxProductsPerInterest);

    // Apply brand diversity filtering
    let finalProducts: ZincProduct[] = interleavedProducts;
    if (options.enableBrandDiversity) {
      finalProducts = applyBrandDiversityFilter(interleavedProducts, {
        maxProductsPerBrand: options.maxProductsPerBrand,
        ensurePriceDiversity: true,
        prioritizePopularBrands: true
      });
    }

    // Limit to target total results
    finalProducts = finalProducts.slice(0, options.targetTotalResults);

    // Calculate breakdown and distribution
    const searchBreakdown = calculateSearchBreakdown(finalProducts, interleavedProducts);
    const brandDistribution = calculateBrandDistribution(finalProducts);

    console.log(`[Multi-Interest Search] Complete: ${finalProducts.length} products from ${interests.length} interests`);
    console.log(`[Multi-Interest Search] Breakdown:`, searchBreakdown);

    return {
      products: finalProducts,
      searchBreakdown,
      brandDistribution,
      totalResults: finalProducts.length
    };

  } catch (error) {
    console.error('[Multi-Interest Search] Error:', error);
    return {
      products: [],
      searchBreakdown: {},
      brandDistribution: {},
      totalResults: 0
    };
  }
};

/**
 * Round-robin interleaving algorithm to fairly mix results from different interests
 */
const roundRobinInterleave = (
  interestResults: { [interest: string]: ZincProduct[] },
  maxPerInterest: number
): EnhancedZincProduct[] => {
  const interests = Object.keys(interestResults);
  const interleavedProducts: EnhancedZincProduct[] = [];
  const seenProductIds = new Set<string>();
  
  // Limit products per interest
  const limitedResults: { [interest: string]: ZincProduct[] } = {};
  for (const interest of interests) {
    limitedResults[interest] = interestResults[interest].slice(0, maxPerInterest);
  }

  // Round-robin through interests
  let maxLength = Math.max(...Object.values(limitedResults).map(arr => arr.length));
  
  for (let i = 0; i < maxLength; i++) {
    for (const interest of interests) {
      const products = limitedResults[interest];
      if (i < products.length) {
        const product = products[i];
        const productId = generateProductId(product);
        
        // Avoid duplicates across interests
        if (!seenProductIds.has(productId)) {
          seenProductIds.add(productId);
          interleavedProducts.push({
            ...product,
            // Add metadata for tracking
            search_source: interest
          });
        }
      }
    }
  }

  return interleavedProducts;
};

/**
 * Generate a unique product ID for deduplication
 */
const generateProductId = (product: ZincProduct): string => {
  const title = (product.title || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
  const price = Math.round(product.price || 0);
  return `${title.substring(0, 50)}-${price}`;
};

/**
 * Calculate how many products came from each interest search
 */
const calculateSearchBreakdown = (
  finalProducts: ZincProduct[],
  interleavedProducts: EnhancedZincProduct[]
): { [interest: string]: number } => {
  const breakdown: { [interest: string]: number } = {};
  
  // Create a mapping of product IDs to interests
  const productToInterest = new Map<string, string>();
  for (const product of interleavedProducts) {
    if (product.search_source) {
      const productId = generateProductId(product);
      productToInterest.set(productId, product.search_source);
    }
  }

  // Count products by their search source
  for (const product of finalProducts) {
    const productId = generateProductId(product);
    const source = productToInterest.get(productId);
    if (source) {
      breakdown[source] = (breakdown[source] || 0) + 1;
    }
  }

  return breakdown;
};

/**
 * Calculate brand distribution in final results
 */
const calculateBrandDistribution = (products: ZincProduct[]): { [brand: string]: number } => {
  const distribution: { [brand: string]: number } = {};
  
  for (const product of products) {
    const brand = extractBrandFromProduct(product);
    distribution[brand] = (distribution[brand] || 0) + 1;
  }
  
  return distribution;
};

/**
 * Extract brand from product
 */
const extractBrandFromProduct = (product: ZincProduct): string => {
  if (product.brand) {
    return product.brand;
  }
  
  // Try to extract from title
  const title = product.title || '';
  const words = title.split(' ');
  
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Lululemon', 'Under Armour',
    'Lego', 'Disney', 'Microsoft', 'Google', 'Amazon', 'Kindle', 'Echo', 'Fire',
    'Fisher-Price', 'Mattel', 'Hasbro', 'Barbie', 'Hot Wheels', 'KONG', 'PetSafe'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Fallback to first meaningful word
  if (words.length > 0 && words[0].length > 2) {
    return words[0];
  }
  
  return 'Generic';
};