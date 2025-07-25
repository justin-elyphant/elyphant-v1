/**
 * Enhanced category search with multiple strategies and brand diversity
 */

import { ZincProduct } from '../../types';
import { searchProducts } from '../../zincService';
import { applyBrandDiversityFilter } from './brandDiversityFilter';
import { filterAndSortProductsBrandFirst } from './enhancedProductFiltering';
import { detectBrandsInMessage } from '@/utils/enhancedBrandUtils';
import { extractAgeFromMessage } from '@/utils/enhancedAgeUtils';

export interface CategorySearchOptions {
  enableBrandDiversity: boolean;
  maxProductsPerBrand: number;
  useMultipleSearchPasses: boolean;
  enableTrendingSearch: boolean;
  targetResultCount: number;
}

export interface CategorySearchResult {
  products: ZincProduct[];
  searchStrategies: string[];
  brandDistribution: { [brand: string]: number };
  totalResults: number;
}

/**
 * Enhanced category search with multiple strategies
 */
export const searchCategoryWithDiversity = async (
  category: string,
  searchTerm: string,
  options: CategorySearchOptions = {
    enableBrandDiversity: true,
    maxProductsPerBrand: 3,
    useMultipleSearchPasses: true,
    enableTrendingSearch: true,
    targetResultCount: 50
  }
): Promise<CategorySearchResult> => {
  const searchStrategies: string[] = [];
  let allProducts: ZincProduct[] = [];
  
  try {
    // Strategy 1: Original search term
    if (searchTerm) {
      console.log(`Category Search Strategy 1: "${searchTerm}"`);
      searchStrategies.push(`Original: "${searchTerm}"`);
      const results1 = await searchProducts(searchTerm);
      allProducts.push(...results1);
    }
    
    // Strategy 2: Enhanced category-specific search
    if (options.useMultipleSearchPasses && allProducts.length < options.targetResultCount) {
      const enhancedTerm = generateEnhancedCategorySearch(category, searchTerm);
      if (enhancedTerm !== searchTerm) {
        console.log(`Category Search Strategy 2: "${enhancedTerm}"`);
        searchStrategies.push(`Enhanced: "${enhancedTerm}"`);
        const results2 = await searchProducts(enhancedTerm);
        allProducts.push(...results2);
      }
    }
    
    // Strategy 3: Brand-specific searches for popular brands in category
    if (options.useMultipleSearchPasses && allProducts.length < options.targetResultCount) {
      const brandSearches = generateBrandSpecificSearches(category);
      for (const brandSearch of brandSearches.slice(0, 2)) { // Limit to 2 brand searches
        console.log(`Category Search Strategy 3: "${brandSearch}"`);
        searchStrategies.push(`Brand-specific: "${brandSearch}"`);
        const results3 = await searchProducts(brandSearch);
        allProducts.push(...results3);
      }
    }
    
    // Strategy 4: Trending/bestseller search
    if (options.enableTrendingSearch && allProducts.length < options.targetResultCount) {
      const trendingSearch = `best selling ${category} trending`;
      console.log(`Category Search Strategy 4: "${trendingSearch}"`);
      searchStrategies.push(`Trending: "${trendingSearch}"`);
      const results4 = await searchProducts(trendingSearch);
      allProducts.push(...results4);
    }
    
    // Remove duplicates
    const uniqueProducts = removeDuplicateProducts(allProducts);
    
    // Apply brand diversity filtering
    let finalProducts = uniqueProducts;
    if (options.enableBrandDiversity) {
      finalProducts = applyBrandDiversityFilter(uniqueProducts, {
        maxProductsPerBrand: options.maxProductsPerBrand,
        ensurePriceDiversity: true,
        prioritizePopularBrands: true
      });
    }
    
    // Calculate brand distribution
    const brandDistribution = calculateBrandDistribution(finalProducts);
    
    console.log(`Category search complete: ${finalProducts.length} products with ${Object.keys(brandDistribution).length} brands`);
    
    return {
      products: finalProducts.slice(0, options.targetResultCount),
      searchStrategies,
      brandDistribution,
      totalResults: finalProducts.length
    };
    
  } catch (error) {
    console.error('Error in category search with diversity:', error);
    return {
      products: [],
      searchStrategies,
      brandDistribution: {},
      totalResults: 0
    };
  }
};

/**
 * Generate enhanced category search terms
 */
const generateEnhancedCategorySearch = (category: string, originalTerm: string): string => {
  const categoryEnhancements: Record<string, string[]> = {
    'pets': ['dog cat supplies', 'pet toys accessories', 'pet care products'],
    'fashion': ['clothing apparel', 'shoes accessories', 'style trends'],
    'tech': ['electronics gadgets', 'smart devices', 'technology'],
    'home': ['home decor', 'furniture accessories', 'household items'],
    'beauty': ['skincare makeup', 'beauty products', 'cosmetics'],
    'toys': ['kids toys', 'educational toys', 'play sets'],
    'sports': ['athletic gear', 'fitness equipment', 'outdoor sports'],
    'books': ['bestselling books', 'reading literature', 'book series'],
    'kitchen': ['cooking tools', 'kitchen gadgets', 'cookware'],
    'baby': ['baby products', 'infant care', 'nursery items']
  };
  
  const enhancements = categoryEnhancements[category.toLowerCase()] || [`${category} products`];
  const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
  
  return `best ${randomEnhancement}`;
};

/**
 * Generate brand-specific searches for category
 */
const generateBrandSpecificSearches = (category: string): string[] => {
  const categoryBrands: Record<string, string[]> = {
    'pets': ['PetSafe', 'KONG', 'Blue Buffalo', 'Hill\'s Science Diet'],
    'fashion': ['Nike', 'Adidas', 'Levi\'s', 'Under Armour'],
    'tech': ['Apple', 'Samsung', 'Sony', 'Microsoft'],
    'home': ['IKEA', 'Wayfair', 'Target', 'West Elm'],
    'beauty': ['Sephora', 'Ulta', 'MAC', 'Clinique'],
    'toys': ['Lego', 'Disney', 'Fisher-Price', 'Mattel'],
    'sports': ['Nike', 'Adidas', 'Under Armour', 'Reebok'],
    'books': ['Penguin', 'HarperCollins', 'Random House'],
    'kitchen': ['KitchenAid', 'Cuisinart', 'All-Clad', 'Instant Pot'],
    'baby': ['Fisher-Price', 'Gerber', 'Pampers', 'Huggies']
  };
  
  const brands = categoryBrands[category.toLowerCase()] || [];
  return brands.map(brand => `best ${brand} ${category}`);
};

/**
 * Remove duplicate products based on title and price similarity
 */
const removeDuplicateProducts = (products: ZincProduct[]): ZincProduct[] => {
  const seen = new Set<string>();
  const unique: ZincProduct[] = [];
  
  for (const product of products) {
    // Create a key based on title and price for deduplication
    const title = (product.title || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
    const price = product.price || 0;
    const key = `${title}-${Math.round(price)}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(product);
    }
  }
  
  return unique;
};

/**
 * Calculate brand distribution in results
 */
const calculateBrandDistribution = (products: ZincProduct[]): { [brand: string]: number } => {
  const distribution: { [brand: string]: number } = {};
  
  for (const product of products) {
    const brand = product.brand || extractBrandFromTitle(product.title || '');
    distribution[brand] = (distribution[brand] || 0) + 1;
  }
  
  return distribution;
};

/**
 * Extract brand from product title
 */
const extractBrandFromTitle = (title: string): string => {
  const words = title.split(' ');
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Lego', 'Disney',
    'Microsoft', 'Google', 'Amazon', 'Fisher-Price', 'Mattel', 'Hasbro'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  return words[0] || 'Generic';
};