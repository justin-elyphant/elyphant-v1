
import { supabase } from "@/integrations/supabase/client";

export interface ZincSearchResult {
  product_id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  retailer: string;
  rating?: number;
  review_count?: number;
  url?: string;
}

export interface ZincSearchResponse {
  results: ZincSearchResult[];
  total: number;
  query: string;
  fallback?: boolean;
  error?: string;
}

/**
 * Search products using the Zinc API via our Edge Function proxy
 */
export const searchZincProducts = async (
  query: string, 
  maxResults: number = 10
): Promise<ZincSearchResponse> => {
  try {
    console.log(`Searching Zinc API for: "${query}" (max: ${maxResults})`);
    
    const { data, error } = await supabase.functions.invoke('zinc-search', {
      body: {
        query: query.trim(),
        maxResults: maxResults.toString()
      }
    });

    if (error) {
      console.error('Zinc search error:', error);
      throw new Error(`Zinc API error: ${error.message}`);
    }

    console.log(`Zinc API returned ${data.results?.length || 0} results`);
    return data as ZincSearchResponse;

  } catch (error) {
    console.error('Error calling Zinc API:', error);
    
    // Return fallback response
    return {
      results: [],
      total: 0,
      query,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test if Zinc API is available and working
 */
export const testZincConnection = async (): Promise<boolean> => {
  try {
    const result = await searchZincProducts("test", 1);
    return !result.fallback && !result.error;
  } catch {
    return false;
  }
};
