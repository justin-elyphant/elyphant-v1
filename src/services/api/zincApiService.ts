
import { productCatalogService } from "../ProductCatalogService";

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
 * Search products using ProductCatalogService
 */
export const searchZincProducts = async (
  query: string, 
  maxResults: number = 10
): Promise<ZincSearchResponse> => {
  try {
    console.log(`Searching products for: "${query}" (max: ${maxResults})`);
    
    const response = await productCatalogService.searchProducts(query, { limit: maxResults });

    if (response.error) {
      console.error('Search error:', response.error);
      throw new Error(response.error);
    }

    const transformedResults: ZincSearchResult[] = (response.products || []).map((product: any) => ({
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

    console.log(`Search returned ${transformedResults.length} results`);
    
    return {
      results: transformedResults,
      total: transformedResults.length,
      query,
      fallback: false
    };

  } catch (error) {
    console.error('Error searching products:', error);
    
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
 * Test if product search is available
 */
export const testZincConnection = async (): Promise<boolean> => {
  try {
    const result = await searchZincProducts("test", 1);
    return !result.fallback && !result.error;
  } catch {
    return false;
  }
};
