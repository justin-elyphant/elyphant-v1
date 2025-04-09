
/**
 * Product search service facade
 * This file re-exports the implementation from the search directory
 * to maintain backward compatibility
 */
import { searchProducts as searchProductsImpl } from "./search/productSearchServiceImpl";
import { ZincProduct } from "../types";

/**
 * Search for products using the Zinc API
 * @param query Search query string
 * @param maxResults Maximum results to return (optional, defaults to 10)
 * @returns Promise with array of product results
 */
export const searchProducts = async (
  query: string,
  maxResults: string = "10"
): Promise<ZincProduct[]> => {
  return searchProductsImpl(query, maxResults);
};
