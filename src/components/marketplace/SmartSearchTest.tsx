/**
 * Smart Search Integration Test Component
 * This component demonstrates the smart search system working with "levis jeans"
 */

import React, { useEffect, useState } from "react";
import { productCatalogService } from "@/services/ProductCatalogService";
import { useSmartSearch } from "@/components/marketplace/hooks/useSmartSearch";
import { SmartSearchIndicator } from "@/components/marketplace/SmartSearchIndicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const SmartSearchTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const {
    search: smartSearch,
    loadMoreSizes,
    searchResult,
    isLoading: smartSearchLoading,
    loadingMoreSizes
  } = useSmartSearch({
    enableSizeOptimization: true,
    showSizeIndicators: true
  });

  const testDirectApiCall = async () => {
    setLoading(true);
    console.log("🧪 Testing direct ProductCatalogService call with 'levis jeans'");
    
    try {
      const response = await productCatalogService.searchProducts("levis jeans", { limit: 20 });
      console.log("🧪 Direct API response:", response);
      setTestResults({
        results: response.products,
        error: response.error,
        cached: false
      });
    } catch (error: any) {
      console.error("🧪 Direct API error:", error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSmartSearch = async () => {
    console.log("🧪 Testing smart search hook with 'levis jeans'");
    await smartSearch("levis jeans");
  };

  useEffect(() => {
    testDirectApiCall();
  }, []);

  return (
    <div className="fixed top-4 right-4 w-80 bg-white border rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-sm">🧪 Smart Search Test Results</h3>
      
      <div className="space-y-2 mb-4">
        <Button 
          size="sm" 
          onClick={testDirectApiCall} 
          disabled={loading}
          className="w-full text-xs"
        >
          Test Direct API
        </Button>
        
        <Button 
          size="sm" 
          onClick={testSmartSearch} 
          disabled={smartSearchLoading}
          className="w-full text-xs"
        >
          Test Smart Search Hook
        </Button>
      </div>

      {searchResult && (
        <div className="mb-4">
          <h4 className="font-medium text-xs mb-1">Smart Search Results:</h4>
          <SmartSearchIndicator
            hasMoreSizes={searchResult.hasMoreSizes}
            sizeOptimized={searchResult.sizeOptimized}
            totalSizeVariations={searchResult.totalSizeVariations}
            suggestedSizeSearches={searchResult.suggestedSizeSearches}
            onLoadMoreSizes={loadMoreSizes}
            onSizeSearch={(query) => smartSearch(query)}
            loading={loadingMoreSizes}
          />
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {searchResult.products.length} products
            </Badge>
            {searchResult.categoryDetected && (
              <Badge variant="secondary" className="text-xs">
                {searchResult.categoryDetected}
              </Badge>
            )}
            {searchResult.fromCache && (
              <Badge variant="default" className="text-xs">
                Cached
              </Badge>
            )}
          </div>
        </div>
      )}

      {testResults && (
        <div>
          <h4 className="font-medium text-xs mb-1">Direct API Results:</h4>
          {testResults.error ? (
            <div className="text-red-600 text-xs">{testResults.error}</div>
          ) : (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {testResults.results?.length || 0} products
                </Badge>
                {testResults.cached && (
                  <Badge variant="default" className="text-xs">
                    Cached
                  </Badge>
                )}
              </div>
              
              {testResults.results && testResults.results.length > 0 && (
                <div className="text-xs space-y-1">
                  <div>Sample product: {testResults.results[0].title}</div>
                  <div>Price: ${testResults.results[0].price}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(loading || smartSearchLoading) && (
        <div className="text-center text-xs">
          <div className="animate-spin h-4 w-4 border-b-2 border-primary mx-auto"></div>
          Testing...
        </div>
      )}
    </div>
  );
};
