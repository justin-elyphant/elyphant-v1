import { Product } from "@/types/product";

export interface ZincProduct {
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
  stars?: number;
  num_reviews?: number;
  product_description?: string;
  feature_bullets?: string[];
  product_details?: any[];
}

export interface ZincSearchResponse {
  results: ZincProduct[];
  total: number;
  query: string;
  page: number;
  total_pages: number;
  time_taken_ms: number;
  error?: string;
  cached?: boolean;
}

class EnhancedZincApiService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.zinc.io/v1';
  private cache: Map<string, { data: ZincSearchResponse; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async callZincApi(endpoint: string, params: any): Promise<ZincSearchResponse | null> {
    if (!this.apiKey) {
      console.error("Zinc API key not set");
      return null;
    }

    const url = `${this.baseUrl}/${endpoint}?${new URLSearchParams(params).toString()}`;
    const cacheKey = url;

    const cachedData = this.cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
      console.log(`[Cache Hit] ${endpoint} - ${params.query}`);
      return { ...cachedData.data, cached: true };
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.apiKey}:`),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ZincSearchResponse = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      console.log(`[API Call] ${endpoint} - ${params.query}`);
      return data;
    } catch (error) {
      console.error("Zinc API error:", error);
      return null;
    }
  }

  /**
   * Search products using Zinc API
   * @param query Search query
   * @param page Page number
   * @param maxResults Max results per page (1-200)
   * @returns ZincSearchResponse or null
   */
  async searchProducts(query: string, page: number = 1, maxResults: number = 10): Promise<ZincSearchResponse> {
    const params = {
      query: query,
      page: page.toString(),
      retailer: 'amazon',
      sort_by: 'relevancy',
      max_results: maxResults.toString()
    };

    const data = await this.callZincApi('search', params);
    return data || { results: [], total: 0, query: query, page: 1, total_pages: 0, time_taken_ms: 0 };
  }

  /**
   * Fetch product details by ID
   * @param productId Product ID
   * @returns ZincProduct or null
   */
  async getProductDetails(productId: string): Promise<ZincProduct | null> {
    const params = {
      product_id: productId,
      retailer: 'amazon'
    };

    const data = await this.callZincApi('product', params) as any; // Adjust type if needed
    return data ? data.product : null;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Zinc API cache cleared.');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      oldest: Array.from(this.cache.values()).sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp,
      newest: Array.from(this.cache.values()).sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
    };
  }

  /**
   * Shuffle array (Fisher-Yates shuffle)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Enhanced category search with multiple specific queries
   */
  private async searchCategoryBatch(categoryKey: string): Promise<Product[]> {
    const categoryQueries = {
      electronics: [
        "best selling smartphones iphone samsung",
        "wireless headphones earbuds airpods",
        "laptops macbook gaming computers",
        "tablets ipad android devices"
      ],
      homeKitchen: [
        "kitchen home cooking utensils cookware",
        "appliances storage organization tools gadgets",
        "dining furniture home essentials",
        "cleaning supplies household items"
      ],
      tech: [
        "smart home devices alexa google nest",
        "gaming accessories controllers keyboards",
        "computer accessories monitors speakers",
        "tech gadgets electronics innovation",
        "wireless charging cables adapters",
        "security cameras smart doorbell"
      ],
      beauty: [
        "skincare makeup cosmetics beauty",
        "hair care shampoo styling products",
        "personal care health wellness",
        "fragrance perfume cologne scents"
      ]
    };

    const queries = categoryQueries[categoryKey] || [];
    const allResults: Product[] = [];

    for (const query of queries) {
      try {
        console.log(`Searching category ${categoryKey} with query: "${query}"`);
        const response = await this.searchProducts(query, 1, 6);
        
        if (response.results && response.results.length > 0) {
          // Add category marker and limit results per query
          const categoryResults = response.results.slice(0, 6).map(product => ({
            ...product,
            categorySource: query,
            // Ensure property name consistency for Product type
            reviewCount: product.review_count || product.num_reviews,
            rating: product.rating || product.stars
          }));
          allResults.push(...categoryResults);
        }
      } catch (error) {
        console.error(`Error searching category ${categoryKey} with query "${query}":`, error);
      }
    }

    // Shuffle and limit total results
    const shuffled = this.shuffleArray(allResults);
    return shuffled.slice(0, 20);
  }

  /**
   * Batch search for multiple categories
   */
  async searchCategories(categoryKeys: string[]): Promise<Product[]> {
    const allResults: Product[] = [];

    for (const categoryKey of categoryKeys) {
      try {
        const categoryResults = await this.searchCategoryBatch(categoryKey);
        allResults.push(...categoryResults);
      } catch (error) {
        console.error(`Error searching category ${categoryKey}:`, error);
      }
    }

    // Shuffle and limit total results
    const shuffled = this.shuffleArray(allResults);
    return shuffled.slice(0, 24);
  }

  /**
   * Alias for searchCategories for luxury categories
   */
  async searchLuxuryCategories(limit: number = 24): Promise<{ results: Product[]; error?: string; cached?: boolean }> {
    try {
      const defaultCategories = ['electronics', 'homeKitchen', 'tech', 'beauty'];
      const results = await this.searchCategories(defaultCategories);
      return { results: results.slice(0, limit) };
    } catch (error) {
      return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Search best selling products by category
   */
  async searchBestSellingByCategory(category: string, limit: number = 20): Promise<{ results: Product[]; error?: string; cached?: boolean }> {
    try {
      const results = await this.searchCategoryBatch(category);
      return { results: results.slice(0, limit) };
    } catch (error) {
      return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get category search query
   */
  getCategorySearchQuery(categoryKey: string): string {
    const categoryQueries = {
      electronics: [
        "best selling smartphones iphone samsung",
        "wireless headphones earbuds airpods",
        "laptops macbook gaming computers",
        "tablets ipad android devices"
      ],
      homeKitchen: [
        "kitchen home cooking utensils cookware",
        "appliances storage organization tools gadgets",
        "dining furniture home essentials",
        "cleaning supplies household items"
      ],
      tech: [
        "smart home devices alexa google nest",
        "gaming accessories controllers keyboards",
        "computer accessories monitors speakers",
        "tech gadgets electronics innovation",
        "wireless charging cables adapters",
        "security cameras smart doorbell"
      ],
      beauty: [
        "skincare makeup cosmetics beauty",
        "hair care shampoo styling products",
        "personal care health wellness",
        "fragrance perfume cologne scents"
      ]
    };
    const queries = categoryQueries[categoryKey] || [];
    return queries.join(' ');
  }

  /**
   * Alias for getProductDetails
   */
  async getProductDetail(productId: string): Promise<ZincProduct | null> {
    return this.getProductDetails(productId);
  }

  /**
   * Get default products for the marketplace
   */
  async getDefaultProducts(limit: number = 24): Promise<{ results: Product[]; error?: string; cached?: boolean }> {
    try {
      const defaultCategories = ['electronics', 'homeKitchen', 'tech', 'beauty'];
      const results = await this.searchCategories(defaultCategories);
      return { results: results.slice(0, limit) };
    } catch (error) {
      return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

const enhancedZincApiService = new EnhancedZincApiService();
export { enhancedZincApiService };
