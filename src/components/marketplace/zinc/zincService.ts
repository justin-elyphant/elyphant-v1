import { normalizeProduct } from "../product-item/productUtils";
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if we have a valid Zinc API token
 */
export const hasValidZincToken = (): boolean => {
  // This is a placeholder - the actual implementation would check local storage
  // or session for a valid token that was previously fetched
  const storedToken = localStorage.getItem('zinc_api_token');
  return !!storedToken;
};

/**
 * Search for products using the Zinc API
 * @param query Search term
 * @param maxResults Maximum number of results to return (optional)
 * @returns Promise with array of product results
 */
export const searchProducts = async (query: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase.functions.invoke("get-products", {
      body: { 
        query,
        page: 1
      }
    });

    if (error) throw new Error(error.message);

    // Return normalized results
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.error("Error calling Zinc Search API:", err);
    return [];
  }
};
