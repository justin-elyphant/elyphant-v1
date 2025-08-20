
import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product } from "@/types/product";
import ProductGrid from "./ProductGrid";
import ProductSkeleton from "./loading/ProductSkeleton";
import MarketplaceToolbar from "./MarketplaceToolbar";
import AdvancedFilterDrawer from "./filters/AdvancedFilterDrawer";
import MobileMarketplaceLayout from "./mobile/MobileMarketplaceLayout";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useEnhancedMarketplaceSearch } from "./hooks/useEnhancedMarketplaceSearch";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onProductView: (productId: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  error?: string | null;
  onRefresh?: () => void;
}

const MarketplaceContent = ({
  products,
  isLoading: externalLoading,
  searchTerm: externalSearchTerm,
  onProductView,
  showFilters,
  setShowFilters,
  error: externalError,
  onRefresh,
}: MarketplaceContentProps) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use enhanced search and filters
  const {
    filteredProducts,
    availableCategories,
    activeFilterCount,
    updateFilters,
    clearFilters,
    filters,
    isSearching,
    error: searchError,
    handleRetrySearch
  } = useEnhancedMarketplaceSearch(currentPage);

  // Combine loading states
  const isLoading = externalLoading || isSearching;
  const error = externalError || searchError;

  // Use mobile layout for mobile devices
  if (isMobile) {
    return (
      <MobileMarketplaceLayout
        products={filteredProducts} // Use filteredProducts from enhanced search
        isLoading={isLoading}
        searchTerm={externalSearchTerm}
        onProductView={onProductView}
        error={error}
        onRefresh={onRefresh}
      />
    );
  }

  // Desktop layout continues as before
  // Error state
  if (error) {
    return (
      <div className="container-content py-space-loose">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-space-standard" />
          <h3 className="text-body-lg font-semibold mb-space-minimal">Something went wrong</h3>
          <p className="text-muted-foreground mb-space-standard">{error}</p>
          <div className="flex gap-tight justify-center">
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="touch">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {searchError && (
              <Button onClick={handleRetrySearch} variant="outline" size="touch">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Search
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container-content py-space-loose">
        <div className="mb-space-loose">
          <div className="h-12 surface-secondary rounded animate-pulse mb-space-standard" />
        </div>
        <ProductSkeleton count={isMobile ? 6 : 12} viewMode={viewMode} />
      </div>
    );
  }

  // Desktop content
  return (
    <div className="container-content py-space-loose">
      <div className="flex gap-loose">
        {/* Desktop Filters Sidebar */}
        {showFilters && (
          <AdvancedFilterDrawer
            filters={filters}
            availableCategories={availableCategories}
            activeFilterCount={activeFilterCount}
            onUpdateFilters={updateFilters}
            onClearFilters={clearFilters}
          />
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-space-loose">
            <MarketplaceToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortOption={filters.sortBy}
              setSortOption={(sortBy) => updateFilters({ sortBy: sortBy as any })}
              totalItems={filteredProducts.length}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              isMobile={isMobile}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mb-space-standard surface-secondary p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-muted-foreground">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                </span>
                <Button
                  variant="ghost"
                  size="touch"
                  onClick={clearFilters}
                  className="text-red-500 hover:text-red-700"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="relative">
            <ProductGrid
              products={filteredProducts}
              viewMode={viewMode}
              sortOption={filters.sortBy}
              onProductView={onProductView}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceContent;
