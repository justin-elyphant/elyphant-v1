
import { searchProducts as searchProductsImpl } from "./services/productSearchService";
import { convertZincProductToProduct } from "./utils/productConverter";
import { Product } from "@/contexts/ProductContext";
import { fetchProductDetails } from "./services/productDetailsService";
import { ZincOrder, ZincProduct } from "./types";
import { useProductValidation } from "./hooks/useProductValidation";

/**
 * Search for products and convert them to our Product format
 * @param query Search query
 * @param maxResults Maximum results to return (defaults to 8)
 * @returns Promise with array of products
 */
export const searchZincProducts = async (query: string, maxResults: string = "8"): Promise<Product[]> => {
  try {
    const zincResults = await searchProductsImpl(query, maxResults);
    
    if (!zincResults || zincResults.length === 0) {
      console.log(`No Zinc results found for "${query}"`);
      return [];
    }
    
    // Convert to our Product format
    const products = zincResults.map(zincProduct => convertZincProductToProduct(zincProduct));
    
    console.log(`Converted ${products.length} Zinc products to our format for "${query}"`);
    return products;
  } catch (error) {
    console.error(`Error in searchZincProducts: ${error}`);
    return [];
  }
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
        phone_number: "555-1234" // Added required phone_number
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

/**
 * Search for products directly, using the implementation from productSearchService
 * @param query Search query
 * @param maxResults Maximum results to return
 * @returns Promise with array of ZincProduct results
 */
export const searchProducts = async (query: string, maxResults: string = "10"): Promise<ZincProduct[]> => {
  return searchProductsImpl(query, maxResults);
};

// Re-export fetchProductDetails for direct access
export { fetchProductDetails };
