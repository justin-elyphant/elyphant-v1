
import { searchZincProducts, ZincSearchResult } from "@/services/api/zincApiService";
import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { ZincProduct } from "@/components/marketplace/zinc/types";

export interface SearchOptions {
  maxResults?: number;
  useRealAPI?: boolean;
  fallbackToMock?: boolean;
}

export interface SearchResponse {
  products: ZincProduct[];
  total: number;
  source: 'zinc-api' | 'mock' | 'fallback';
  query: string;
}

/**
 * Unified search service that handles both real Zinc API and mock data
 */
export const searchProducts = async (
  query: string, 
  options: SearchOptions = {}
): Promise<SearchResponse> => {
  const {
    maxResults = 10,
    useRealAPI = true,
    fallbackToMock = true
  } = options;

  console.log(`Unified search for: "${query}" (useRealAPI: ${useRealAPI})`);

  // Try real API first if enabled
  if (useRealAPI) {
    try {
      const zincResponse = await searchZincProducts(query, maxResults);
      
      if (!zincResponse.fallback && zincResponse.results.length > 0) {
        console.log(`Real API returned ${zincResponse.results.length} results`);
        
        // Convert to ZincProduct format
        const products: ZincProduct[] = zincResponse.results.map(result => ({
          product_id: result.product_id,
          title: result.title,
          price: result.price,
          description: result.description,
          image: result.image,
          images: result.images || [result.image],
          category: result.category,
          retailer: result.retailer,
          rating: result.rating,
          review_count: result.review_count
        }));

        return {
          products,
          total: zincResponse.total,
          source: 'zinc-api',
          query
        };
      }
    } catch (error) {
      console.error('Real API search failed:', error);
    }
  }

  // Fallback to mock data
  if (fallbackToMock) {
    console.log('Using mock data for search');
    const mockProducts = searchMockProducts(query, maxResults);
    
    return {
      products: mockProducts,
      total: mockProducts.length,
      source: useRealAPI ? 'fallback' : 'mock',
      query
    };
  }

  // No results
  return {
    products: [],
    total: 0,
    source: 'fallback',
    query
  };
};

/**
 * Test connectivity to all search services
 */
export const testSearchServices = async () => {
  const results = {
    zincApi: false,
    mockData: true // Mock data is always available
  };

  try {
    const testSearch = await searchZincProducts("test", 1);
    results.zincApi = !testSearch.fallback && !testSearch.error;
  } catch {
    results.zincApi = false;
  }

  return results;
};
