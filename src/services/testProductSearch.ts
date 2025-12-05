/**
 * Test Product Search Service
 * Utility to verify product search functionality and troubleshoot issues
 */
import { productCatalogService } from "@/services/ProductCatalogService";

export class TestProductSearch {
  /**
   * Test basic product search functionality
   */
  static async testBasicSearch(query: string = "bluetooth headphones"): Promise<void> {
    console.log(`[TestProductSearch] Testing basic search: "${query}"`);
    
    try {
      const startTime = Date.now();
      const response = await productCatalogService.searchProducts(query, { limit: 5 });
      const duration = Date.now() - startTime;
      
      console.log(`[TestProductSearch] Search completed in ${duration}ms`);
      console.log(`[TestProductSearch] Results:`, {
        count: response.products?.length || 0,
        hasError: !!response.error,
        error: response.error,
        sampleProduct: response.products?.[0]?.title
      });
      
      if (response.error) {
        console.error(`[TestProductSearch] Search failed: ${response.error}`);
      } else {
        console.log(`[TestProductSearch] ✅ Basic search successful`);
      }
      
      return;
    } catch (error) {
      console.error(`[TestProductSearch] ❌ Basic search failed:`, error);
      throw error;
    }
  }

  /**
   * Test category-specific searches
   */
  static async testCategorySearches(): Promise<void> {
    console.log(`[TestProductSearch] Testing category searches...`);
    
    const tests = [
      { name: "Luxury Categories", options: { luxuryCategories: true, limit: 5 } },
      { name: "Gifts for Her", options: { giftsForHer: true, limit: 5 } },
      { name: "Gifts for Him", options: { giftsForHim: true, limit: 5 } },
      { name: "Gifts Under $50", options: { giftsUnder50: true, limit: 5 } },
      { name: "Brand Categories (Apple)", query: "Apple", options: { limit: 5 } }
    ];
    
    for (const test of tests) {
      try {
        console.log(`[TestProductSearch] Testing ${test.name}...`);
        const startTime = Date.now();
        const response = await productCatalogService.searchProducts(test.query || '', test.options);
        const duration = Date.now() - startTime;
        
        console.log(`[TestProductSearch] ${test.name} completed in ${duration}ms: ${response.products?.length || 0} results`);
        
        if (response.error) {
          console.error(`[TestProductSearch] ❌ ${test.name} failed: ${response.error}`);
        } else {
          console.log(`[TestProductSearch] ✅ ${test.name} successful`);
        }
      } catch (error) {
        console.error(`[TestProductSearch] ❌ ${test.name} error:`, error);
      }
    }
  }

  /**
   * Test unified marketplace service
   */
  static async testUnifiedMarketplace(): Promise<void> {
    console.log(`[TestProductSearch] Testing unified marketplace service...`);
    
    try {
      const startTime = Date.now();
      const response = await productCatalogService.searchProducts("tech gadgets", { limit: 5 });
      const duration = Date.now() - startTime;
      
      console.log(`[TestProductSearch] Unified marketplace search completed in ${duration}ms`);
      console.log(`[TestProductSearch] Products found: ${response.products.length}`);
      
      if (response.products.length > 0) {
        console.log(`[TestProductSearch] ✅ Unified marketplace successful`);
        console.log(`[TestProductSearch] Sample product:`, response.products[0].title);
      } else {
        console.error(`[TestProductSearch] ❌ Unified marketplace returned no products`);
      }
      
    } catch (error) {
      console.error(`[TestProductSearch] ❌ Unified marketplace error:`, error);
      throw error;
    }
  }

  /**
   * Run comprehensive test suite
   */
  static async runFullTest(): Promise<void> {
    console.log(`[TestProductSearch] 🚀 Starting comprehensive product search test...`);
    
    try {
      await this.testBasicSearch();
      await this.testCategorySearches();
      await this.testUnifiedMarketplace();
      
      console.log(`[TestProductSearch] ✅ All tests completed successfully!`);
    } catch (error) {
      console.error(`[TestProductSearch] ❌ Test suite failed:`, error);
      throw error;
    }
  }
}

// Export for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testProductSearch = TestProductSearch;
}
