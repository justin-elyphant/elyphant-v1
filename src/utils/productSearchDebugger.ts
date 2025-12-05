/**
 * Product Search Debugger Utility
 * Comprehensive debugging and monitoring for product search functionality
 */
import { productCatalogService } from "@/services/ProductCatalogService";

export class ProductSearchDebugger {
  /**
   * Comprehensive health check for product search system
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    details: Record<string, any>;
  }> {
    const issues: string[] = [];
    const details: Record<string, any> = {};

    try {
      // Test 1: Basic API connectivity
      console.log('[ProductSearchDebugger] Testing basic API connectivity...');
      const startTime = Date.now();
      const basicSearch = await productCatalogService.searchProducts("test", { limit: 1 });
      const basicSearchTime = Date.now() - startTime;
      
      details.basicSearch = {
        duration: basicSearchTime,
        hasResults: basicSearch.products && basicSearch.products.length > 0,
        hasError: !!basicSearch.error,
        error: basicSearch.error
      };

      if (basicSearch.error) {
        issues.push(`Basic search failed: ${basicSearch.error}`);
      } else if (!basicSearch.products || basicSearch.products.length === 0) {
        issues.push('Basic search returned no results');
      }

      // Test 2: Category searches
      console.log('[ProductSearchDebugger] Testing category searches...');
      const categoryTests = [
        { name: 'luxury', options: { luxuryCategories: true, limit: 3 } },
        { name: 'giftsForHer', options: { giftsForHer: true, limit: 3 } },
        { name: 'giftsForHim', options: { giftsForHim: true, limit: 3 } }
      ];

      for (const test of categoryTests) {
        try {
          const result = await productCatalogService.searchProducts('', test.options);
          details[test.name] = {
            hasResults: result.products && result.products.length > 0,
            hasError: !!result.error,
            error: result.error
          };

          if (result.error) {
            issues.push(`${test.name} search failed: ${result.error}`);
          }
        } catch (error) {
          issues.push(`${test.name} search threw error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          details[test.name] = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Test 3: Performance check
      if (basicSearchTime > 10000) {
        issues.push(`Slow response time: ${basicSearchTime}ms`);
      }

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (issues.length === 0) {
        status = 'healthy';
      } else if (issues.length <= 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return { status, issues, details };

    } catch (error) {
      console.error('[ProductSearchDebugger] Health check failed:', error);
      return {
        status: 'unhealthy',
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        details: { criticalError: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Monitor edge function health
   */
  static async checkEdgeFunctionHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const result = await productCatalogService.searchProducts("health check", { limit: 1 });
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: !result.error,
        responseTime,
        error: result.error
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Debug product search with detailed logging
   */
  static async debugSearch(query: string, options?: any): Promise<{
    success: boolean;
    results: any[];
    debugInfo: Record<string, any>;
    error?: string;
  }> {
    const debugInfo: Record<string, any> = {};
    
    try {
      console.log(`[ProductSearchDebugger] Debugging search: "${query}"`);
      debugInfo.query = query;
      debugInfo.options = options;
      debugInfo.timestamp = new Date().toISOString();
      
      const startTime = Date.now();
      const response = await productCatalogService.searchProducts(query, { limit: 10 });
      const duration = Date.now() - startTime;
      
      debugInfo.duration = duration;
      debugInfo.hasError = !!response.error;
      debugInfo.resultCount = response.products?.length || 0;
      
      if (response.error) {
        debugInfo.error = response.error;
        return {
          success: false,
          results: [],
          debugInfo,
          error: response.error
        };
      }
      
      debugInfo.sampleResults = response.products?.slice(0, 3).map(p => ({
        title: p.title,
        price: p.price,
        hasImage: !!p.image
      }));
      
      return {
        success: true,
        results: response.products || [],
        debugInfo
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugInfo.criticalError = errorMessage;
      
      return {
        success: false,
        results: [],
        debugInfo,
        error: errorMessage
      };
    }
  }

  /**
   * Run periodic health monitoring
   */
  static startHealthMonitoring(intervalMinutes: number = 5): void {
    console.log(`[ProductSearchDebugger] Starting health monitoring (${intervalMinutes} minute intervals)`);
    
    const monitor = async () => {
      const health = await this.healthCheck();
      console.log(`[ProductSearchDebugger] Health status: ${health.status}`, {
        issues: health.issues,
        details: health.details
      });
      
      if (health.status === 'unhealthy') {
        console.error('[ProductSearchDebugger] 🚨 Product search system is unhealthy!', health);
      } else if (health.status === 'degraded') {
        console.warn('[ProductSearchDebugger] ⚠️ Product search system is degraded', health);
      }
    };
    
    // Run initial check
    monitor();
    
    // Set up periodic monitoring
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }
}

// Export for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).productSearchDebugger = ProductSearchDebugger;
}
