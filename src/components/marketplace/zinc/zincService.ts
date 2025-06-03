import { optimizedSearchService } from "@/services/search/optimizedSearchService";
import { convertZincProductToProduct } from "./utils/productConverter";
import { Product } from "@/contexts/ProductContext";
import { fetchProductDetails } from "./services/productDetailsService";
import { ZincOrder, ZincProduct } from "./types";

/**
 * Optimized Zinc service with aggressive caching and cost reduction
 */

/**
 * Search for products and convert them to our Product format
 * Now uses optimized search service with intelligent caching
 */
export const searchZincProducts = async (query: string, maxResults: string = "8"): Promise<Product[]> => {
  try {
    console.log(`ZincService: Optimized search for "${query}" (max: ${maxResults})`);
    
    const zincResults = await optimizedSearchService.searchProducts(query, {
      maxResults: parseInt(maxResults, 10)
    });
    
    if (!zincResults || zincResults.length === 0) {
      console.log(`ZincService: No optimized results found for "${query}"`);
      return [];
    }
    
    // Convert to our Product format
    const products = zincResults.map(zincProduct => convertZincProductToProduct(zincProduct));
    
    console.log(`ZincService: Converted ${products.length} optimized products for "${query}"`);
    return products;
  } catch (error) {
    console.error(`ZincService: Error in optimized search: ${error}`);
    return [];
  }
};

/**
 * Search for products directly, using the optimized implementation
 */
export const searchProducts = async (query: string, maxResults: string = "10"): Promise<ZincProduct[]> => {
  return optimizedSearchService.searchProducts(query, {
    maxResults: parseInt(maxResults, 10)
  });
};

/**
 * Batch search for multiple queries with optimization
 */
export const batchSearchProducts = async (
  queries: string[], 
  maxResults: number = 10
): Promise<Map<string, ZincProduct[]>> => {
  return optimizedSearchService.batchSearch(queries, { maxResults });
};

/**
 * Get search metrics and cost savings
 */
export const getSearchMetrics = () => {
  return optimizedSearchService.getMetrics();
};

/**
 * Preload popular searches to improve cache hit rates
 */
export const preloadPopularSearches = async (queries: string[]) => {
  return optimizedSearchService.preloadPopularSearches(queries);
};

/**
 * Make a test purchase (mock function for development)
 */
export const testPurchase = async (productId: string): Promise<ZincOrder | null> => {
  try {
    console.log(`Making test purchase for product ID: ${productId}`);
    
    // For now, return a mock order
    const mockOrder: ZincOrder = {
      id: `ORDER-${Date.now()}`,
      status: "processing",
      items: [{
        name: "Test Product",
        quantity: 1,
        price: 99.99
      }],
      date: new Date().toISOString(),
      total_price: 99.99,
      shipping_address: {
        first_name: "Test",
        last_name: "User",
        address_line1: "123 Test St",
        zip_code: "12345",
        city: "Test City",
        state: "TS",
        country: "US",
        phone_number: "555-1234"
      }
    };
    
    return mockOrder;
  } catch (error) {
    console.error(`Error in testPurchase: ${error}`);
    return null;
  }
};

/**
 * Enhance a product with valid images using our validation hooks
 * @param product The product to enhance
 * @returns The enhanced product
 */
export const enhanceProductWithImages = (product: ZincProduct): ZincProduct => {
  // Use the validation logic directly from the utils
  const { validateProductImages } = require("./services/search/productValidationUtils");
  return validateProductImages(product, product.title || "");
};

// Re-export fetchProductDetails for direct access
export { fetchProductDetails };
