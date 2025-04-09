
import { searchProducts } from "./services/productSearchService";
import { convertZincProductToProduct } from "./utils/productConverter";
import { Product } from "@/contexts/ProductContext";

/**
 * Search for products and convert them to our Product format
 * @param query Search query
 * @param maxResults Maximum results to return (defaults to 8)
 * @returns Promise with array of products
 */
export const searchZincProducts = async (query: string, maxResults = "8"): Promise<Product[]> => {
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

// Re-export searchProducts to make it available directly from zincService
export { searchProducts };
