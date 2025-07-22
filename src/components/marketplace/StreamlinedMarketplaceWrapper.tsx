
import React from "react";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import { useIsMobile } from "@/hooks/use-mobile";
import EnhancedSearchBar from "@/components/search/EnhancedSearchBar";
import ProductGridOptimized from "./ProductGridOptimized";
import { Skeleton } from "@/components/ui/skeleton";

const StreamlinedMarketplaceWrapper = () => {
  const isMobile = useIsMobile();
  
  // Use the unified marketplace hook
  const {
    products,
    isLoading,
    error,
    searchTerm,
    urlSearchTerm,
    luxuryCategories,
    search,
    clearSearch
  } = useUnifiedMarketplace({
    autoLoadOnMount: true
  });

  const handleSearch = (query: string) => {
    if (query.trim()) {
      search(query);
    } else {
      clearSearch();
    }
  };

  // Show loading skeleton during initial load
  if (isLoading && products.length === 0) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-safe' : ''}`}>
        {/* Search Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <EnhancedSearchBar 
              onSearch={handleSearch}
              initialSearchTerm={urlSearchTerm}
              placeholder="Search for products, brands, or categories..."
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-safe' : ''}`}>
      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <EnhancedSearchBar 
            onSearch={handleSearch}
            initialSearchTerm={urlSearchTerm}
            placeholder="Search for products, brands, or categories..."
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        {(urlSearchTerm || luxuryCategories) && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {luxuryCategories ? "Luxury Collections" : `Search Results`}
            </h1>
            {urlSearchTerm && (
              <p className="text-gray-600 mt-1">
                Results for "{urlSearchTerm}" • {products.length} items
              </p>
            )}
            {luxuryCategories && (
              <p className="text-gray-600 mt-1">
                Premium brands and designer collections • {products.length} items
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️ Search Error</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => search(searchTerm)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {urlSearchTerm ? "No results found" : "Start your search"}
            </h3>
            <p className="text-gray-600">
              {urlSearchTerm 
                ? `We couldn't find any products matching "${urlSearchTerm}"`
                : "Search for products, brands, or categories to get started"
              }
            </p>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <ProductGridOptimized 
            products={products}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default StreamlinedMarketplaceWrapper;
