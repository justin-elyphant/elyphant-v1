
import { enhancedZincApiService } from "../enhancedZincApiService";

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
 * Search products using the Enhanced Zinc API System
 */
export const searchZincProducts = async (
  query: string, 
  maxResults: number = 10
): Promise<ZincSearchResponse> => {
  try {
    console.log(`Searching Enhanced Zinc API for: "${query}" (max: ${maxResults})`);
    
    const response = await enhancedZincApiService.searchProducts(query, 1, maxResults);

    if (response.error && !response.cached) {
      console.error('Enhanced Zinc search error:', response.error);
      throw new Error(`Enhanced Zinc API error: ${response.error}`);
    }

    const transformedResults: ZincSearchResult[] = (response.results || []).map((product: any) => ({
      product_id: product.product_id,
      title: product.title,
      price: product.price,
      description: product.description || product.product_description,
      image: product.image || product.main_image,
      images: product.images || [product.image || product.main_image],
      category: product.category,
      retailer: product.retailer || 'Amazon via Zinc',
      rating: product.rating || product.stars,
      review_count: product.review_count || product.num_reviews,
      url: product.url || product.product_url
    }));

    console.log(`Enhanced Zinc API returned ${transformedResults.length} results`);
    
    return {
      results: transformedResults,
      total: transformedResults.length,
      query,
      fallback: response.cached || false
    };

  } catch (error) {
    console.error('Error calling Enhanced Zinc API:', error);
    
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
 * Test if Enhanced Zinc API is available and working
 */
export const testZincConnection = async (): Promise<boolean> => {
  try {
    const result = await searchZincProducts("test", 1);
    return !result.fallback && !result.error;
  } catch {
    return false;
  }
};
