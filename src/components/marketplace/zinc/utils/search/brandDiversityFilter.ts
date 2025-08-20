/**
 * Brand diversity filtering system to ensure variety in category searches
 */

import { ZincProduct } from '../../types';

export interface BrandDiversityOptions {
  maxProductsPerBrand: number;
  ensurePriceDiversity: boolean;
  prioritizePopularBrands: boolean;
  rotationSeed?: string; // For consistent but rotating results
}

export interface BrandDistribution {
  brand: string;
  count: number;
  products: ZincProduct[];
  priceRange: { min: number; max: number };
}

/**
 * Apply brand diversity filtering to ensure variety
 */
export const applyBrandDiversityFilter = (
  products: ZincProduct[],
  options: BrandDiversityOptions = {
    maxProductsPerBrand: 3,
    ensurePriceDiversity: true,
    prioritizePopularBrands: true
  }
): ZincProduct[] => {
  if (!products.length) return products;

  // Group products by brand
  const brandGroups = groupProductsByBrand(products);
  
  // Apply brand limits and diversity rules
  const diversifiedProducts: ZincProduct[] = [];
  const usedBrands = new Set<string>();
  
  // First pass: Add highest quality products from each brand
  for (const [brand, brandProducts] of Object.entries(brandGroups)) {
    const sortedBrandProducts = sortProductsByQuality(brandProducts);
    const selectedCount = Math.min(options.maxProductsPerBrand, sortedBrandProducts.length);
    
    for (let i = 0; i < selectedCount; i++) {
      diversifiedProducts.push(sortedBrandProducts[i]);
    }
    
    usedBrands.add(brand);
  }
  
  // Apply price diversity if enabled
  if (options.ensurePriceDiversity) {
    return ensurePriceDiversity(diversifiedProducts);
  }
  
  // Sort by quality score
  return diversifiedProducts.sort((a, b) => calculateQualityScore(b) - calculateQualityScore(a));
};

/**
 * Group products by brand (or extract brand from title)
 */
const groupProductsByBrand = (products: ZincProduct[]): Record<string, ZincProduct[]> => {
  const groups: Record<string, ZincProduct[]> = {};
  
  for (const product of products) {
    const brand = extractBrand(product);
    if (!groups[brand]) {
      groups[brand] = [];
    }
    groups[brand].push(product);
  }
  
  return groups;
};

/**
 * Extract brand from product (use brand field or try to detect from title)
 */
const extractBrand = (product: ZincProduct): string => {
  if (product.brand) {
    return product.brand;
  }
  
  // Try to extract brand from title
  const title = product.title || '';
  const words = title.split(' ');
  
  // Common brand detection patterns
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Lego', 'Disney',
    'Microsoft', 'Google', 'Amazon', 'Kindle', 'Echo', 'Fire',
    'Fisher-Price', 'Mattel', 'Hasbro', 'Barbie', 'Hot Wheels',
    'Lululemon', 'Under Armour', 'Patagonia', 'REI', 'Samsonite',
    'Away', 'Tumi', 'North Face', 'Columbia', 'Osprey'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Fallback: use first word if it looks like a brand
  if (words.length > 0 && words[0].length > 2) {
    return words[0];
  }
  
  return 'Generic';
};

/**
 * Sort products by quality score (rating, reviews, price)
 */
const sortProductsByQuality = (products: ZincProduct[]): ZincProduct[] => {
  return products.sort((a, b) => calculateQualityScore(b) - calculateQualityScore(a));
};

/**
 * Calculate quality score for a product
 */
const calculateQualityScore = (product: ZincProduct): number => {
  let score = 0;
  
  // Rating component (0-50 points)
  if (product.rating && product.rating > 0) {
    score += (product.rating / 5) * 50;
  }
  
  // Review count component (0-30 points)
  if (product.review_count && product.review_count > 0) {
    // Logarithmic scale for review count
    score += Math.min(Math.log10(product.review_count) * 10, 30);
  }
  
  // Price reasonableness (0-20 points)
  if (product.price && product.price > 0) {
    // Prefer products in reasonable price ranges
    if (product.price <= 50) score += 20;
    else if (product.price <= 100) score += 15;
    else if (product.price <= 200) score += 10;
    else score += 5;
  }
  
  return score;
};

/**
 * Ensure price diversity across selected products
 */
const ensurePriceDiversity = (products: ZincProduct[]): ZincProduct[] => {
  if (products.length <= 3) return products;
  
  // Sort by price
  const sortedByPrice = [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
  
  // Create price buckets: budget (0-25%), mid (25-75%), premium (75-100%)
  const priceRange = {
    min: sortedByPrice[0]?.price || 0,
    max: sortedByPrice[sortedByPrice.length - 1]?.price || 100
  };
  
  const range = priceRange.max - priceRange.min;
  const bucketSize = range / 3;
  
  const buckets = {
    budget: [] as ZincProduct[],
    mid: [] as ZincProduct[],
    premium: [] as ZincProduct[]
  };
  
  // Distribute products into price buckets
  for (const product of products) {
    const price = product.price || 0;
    if (price <= priceRange.min + bucketSize) {
      buckets.budget.push(product);
    } else if (price <= priceRange.min + 2 * bucketSize) {
      buckets.mid.push(product);
    } else {
      buckets.premium.push(product);
    }
  }
  
  // Take best products from each bucket
  const diversifiedProducts: ZincProduct[] = [];
  const maxPerBucket = Math.ceil(products.length / 3);
  
  [buckets.budget, buckets.mid, buckets.premium].forEach(bucket => {
    const sortedBucket = sortProductsByQuality(bucket);
    diversifiedProducts.push(...sortedBucket.slice(0, maxPerBucket));
  });
  
  return diversifiedProducts;
};

/**
 * Generate brand distribution analytics
 */
export const analyzeBrandDistribution = (products: ZincProduct[]): BrandDistribution[] => {
  const brandGroups = groupProductsByBrand(products);
  
  return Object.entries(brandGroups).map(([brand, brandProducts]) => {
    const prices = brandProducts.map(p => p.price || 0).filter(p => p > 0);
    
    return {
      brand,
      count: brandProducts.length,
      products: brandProducts,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    };
  }).sort((a, b) => b.count - a.count);
};