import { searchProducts } from "./services/productSearchService";
import { convertZincProductToProduct } from "./utils/productConverter";
import { Product } from "@/contexts/ProductContext";
import { fetchProductDetails } from "./services/productDetailsService";
import { ZincOrder } from "./types";
import { ZincProduct } from "./types";

/**
 * Search for products and convert them to our Product format
 * @param query Search query
 * @param maxResults Maximum results to return (defaults to 8)
 * @returns Promise with array of products
 */
export const searchZincProducts = async (query: string, maxResults: string = "8"): Promise<Product[]> => {
  try {
    const zincResults = await searchProducts(query, maxResults);
    
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

// Ensure better image handling in search results
export const enhanceProductWithImages = (product: ZincProduct): ZincProduct => {
  // Import the validation logic
  const { validateProductImages } = require("./services/search/productValidationUtils");
  
  // Use the validation logic to enhance the product
  return validateProductImages(product, product.title || "");
};

/**
 * Get a product-specific fallback image based on name and category
 */
const getProductFallbackImage = (name: string, category?: string): string => {
  const productName = name.toLowerCase();
  const productCategory = category?.toLowerCase() || '';
  
  // Try to match product name with specific products
  if (productName.includes('hat') || productName.includes('cap')) {
    return 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&h=500&fit=crop'; // Hat
  }
  if (productName.includes('padres')) {
    return 'https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=500&h=500&fit=crop'; // Baseball theme
  }
  if (productName.includes('macbook') || productName.includes('laptop')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'; // Laptop image
  }
  
  // Generic image based on category
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
};

// Re-export searchProducts and fetchProductDetails to make them available directly from zincService
export { searchProducts, fetchProductDetails };
