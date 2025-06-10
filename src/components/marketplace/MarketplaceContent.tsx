
import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product } from "@/types/product";
import ProductGrid from "./ProductGrid";
import ProductSkeleton from "./loading/ProductSkeleton";
import MarketplaceToolbar from "./MarketplaceToolbar";
import AdvancedFilterDrawer from "./filters/AdvancedFilterDrawer";
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

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {searchError && (
              <Button onClick={handleRetrySearch} variant="outline">
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-12 bg-gray-200 rounded animate-pulse mb-4" />
        </div>
        <ProductSkeleton count={isMobile ? 6 : 12} viewMode={viewMode} />
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        {!isMobile && showFilters && (
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
          <div className="mb-6">
            {isMobile ? (
              <div className="flex items-center justify-between gap-4">
                <AdvancedFilterDrawer
                  filters={filters}
                  availableCategories={availableCategories}
                  activeFilterCount={activeFilterCount}
                  onUpdateFilters={updateFilters}
                  onClearFilters={clearFilters}
                />
                
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
            ) : (
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
            )}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                </span>
                <Button
                  variant="ghost"
                  size="sm"
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

          {/* Toolbar */}
          <div className="mb-6">
            {isMobile ? (
              <div className="flex items-center justify-between gap-4">
                <AdvancedFilterDrawer
                  filters={filters}
                  availableCategories={availableCategories}
                  activeFilterCount={activeFilterCount}
                  onUpdateFilters={updateFilters}
                  onClearFilters={clearFilters}
                />
                
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
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceContent;
