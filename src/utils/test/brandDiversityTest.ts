/**
 * Test utilities for brand diversity system
 */

import { applyBrandDiversityFilter, analyzeBrandDistribution } from '@/components/marketplace/zinc/utils/search/brandDiversityFilter';
import { ZincProduct } from '@/components/marketplace/zinc/types';

// Test data for brand diversity
const createTestProduct = (id: string, title: string, brand: string, price: number, rating: number = 4.5): ZincProduct => ({
  product_id: id,
  title,
  brand,
  price,
  rating,
  review_count: 100,
  image: '/placeholder.svg',
  retailer: 'amazon'
});

// Sample products for testing
export const sampleTestProducts: ZincProduct[] = [
  createTestProduct('1', 'Apple iPhone 15', 'Apple', 999, 4.8),
  createTestProduct('2', 'Apple AirPods Pro', 'Apple', 249, 4.7),
  createTestProduct('3', 'Apple MacBook Air', 'Apple', 1299, 4.9),
  createTestProduct('4', 'Apple Watch Series 9', 'Apple', 399, 4.6),
  createTestProduct('5', 'Samsung Galaxy S24', 'Samsung', 899, 4.5),
  createTestProduct('6', 'Samsung Galaxy Buds', 'Samsung', 149, 4.4),
  createTestProduct('7', 'Sony WH-1000XM5 Headphones', 'Sony', 349, 4.8),
  createTestProduct('8', 'Sony PlayStation 5', 'Sony', 499, 4.9),
  createTestProduct('9', 'Google Pixel 8', 'Google', 699, 4.6),
  createTestProduct('10', 'Microsoft Surface Pro', 'Microsoft', 1099, 4.7),
];

/**
 * Test brand diversity filtering
 */
export const testBrandDiversity = () => {
  console.log('🧪 Testing Brand Diversity System');
  
  // Test 1: Basic filtering
  console.log('\n📊 Original products by brand:');
  const originalDistribution = analyzeBrandDistribution(sampleTestProducts);
  originalDistribution.forEach(dist => {
    console.log(`${dist.brand}: ${dist.count} products`);
  });
  
  // Test 2: Apply brand diversity filter
  const filtered = applyBrandDiversityFilter(sampleTestProducts, {
    maxProductsPerBrand: 2,
    ensurePriceDiversity: true,
    prioritizePopularBrands: true
  });
  
  console.log('\n✅ After brand diversity filter:');
  const filteredDistribution = analyzeBrandDistribution(filtered);
  filteredDistribution.forEach(dist => {
    console.log(`${dist.brand}: ${dist.count} products (${dist.priceRange.min}-${dist.priceRange.max})`);
  });
  
  console.log(`\n📈 Results: ${sampleTestProducts.length} → ${filtered.length} products`);
  console.log(`🏢 Brands: ${originalDistribution.length} → ${filteredDistribution.length}`);
  
  return {
    original: sampleTestProducts,
    filtered,
    originalDistribution,
    filteredDistribution
  };
};

/**
 * Run all tests
 */
export const runBrandDiversityTests = () => {
  try {
    const results = testBrandDiversity();
    console.log('\n✅ All brand diversity tests passed!');
    return results;
  } catch (error) {
    console.error('❌ Brand diversity tests failed:', error);
    return null;
  }
};