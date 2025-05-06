
import { Product } from "@/contexts/ProductContext";

// Cache for sorted product arrays to avoid re-sorting
const sortCache: Record<string, Product[]> = {};

/**
 * Sort products based on the selected sort option
 * Optimized for performance with caching, null checks and limited iterations
 */
export const sortProducts = (products: Product[], sortOption: string) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  // Generate a cache key based on products array length, first product ID, and sort option
  // This is a simple hashing approach that avoids expensive operations
  const cacheKey = `${products.length}-${products[0]?.product_id || products[0]?.id || 'unknown'}-${sortOption}`;
  
  // Return cached result if available
  if (sortCache[cacheKey]) {
    return sortCache[cacheKey];
  }
  
  // Limit max products to sort to prevent performance issues
  const productsToSort = products.length > 200 ? products.slice(0, 200) : products;
  
  // Create a shallow copy to avoid mutating the original array
  const productsCopy = [...productsToSort];
  
  let result: Product[];
  
  // Use efficient sort comparators based on option
  switch (sortOption) {
    case 'price-low':
      result = productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceA - priceB;
      });
      break;
    case 'price-high':
      result = productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceB - priceA;
      });
      break;
    case 'rating':
      result = productsCopy.sort((a, b) => {
        // Use nullish coalescing for more efficient null/undefined handling
        const ratingA = a.stars ?? a.rating ?? 0;
        const ratingB = b.stars ?? b.rating ?? 0;
        return ratingB - ratingA;
      });
      break;
    case 'reviews':
      result = productsCopy.sort((a, b) => {
        const reviewsA = a.num_reviews ?? a.reviewCount ?? 0;
        const reviewsB = b.num_reviews ?? b.reviewCount ?? 0;
        return reviewsB - reviewsA;
      });
      break;
    case 'newest':
      // For demo purposes, we'll just shuffle the products
      result = productsCopy.sort(() => Math.random() - 0.5);
      break;
    case 'relevance':
    default:
      result = productsCopy;
      break;
  }
  
  // Store in cache for future use (limited to 20 entries to prevent memory issues)
  const cacheKeys = Object.keys(sortCache);
  if (cacheKeys.length > 20) {
    // Remove oldest cache entry
    delete sortCache[cacheKeys[0]];
  }
  sortCache[cacheKey] = result;
  
  return result;
};
