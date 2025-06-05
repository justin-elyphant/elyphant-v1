
import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product } from "@/types/product";
import ProductGrid from "./ProductGrid";
import ProductSkeleton from "./loading/ProductSkeleton";
import MarketplaceToolbar from "./MarketplaceToolbar";
import MobileFilterDrawer from "./filters/MobileFilterDrawer";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

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
  isLoading,
  searchTerm,
  onProductView,
  showFilters,
  setShowFilters,
  error,
  onRefresh
}: MarketplaceContentProps) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState("relevance");

  // Memoize active filters count for performance
  const activeFiltersCount = useMemo(() => {
    // This would count actual active filters in a real implementation
    return 0;
  }, []);

  const handleClearFilters = () => {
    // Implementation for clearing filters
    console.log("Clearing filters");
  };

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
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
      {/* Toolbar */}
      <div className="mb-6">
        {isMobile ? (
          <div className="flex items-center justify-between gap-4">
            <MobileFilterDrawer
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
            >
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  Filters will be implemented here
                </p>
              </div>
            </MobileFilterDrawer>
            
            <MarketplaceToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortOption={sortOption}
              setSortOption={setSortOption}
              totalItems={products.length}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              isMobile={isMobile}
            />
          </div>
        ) : (
          <MarketplaceToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortOption={sortOption}
            setSortOption={setSortOption}
            totalItems={products.length}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Product Grid */}
      <div className="relative">
        <ProductGrid
          products={products}
          viewMode={viewMode}
          sortOption={sortOption}
          onProductView={onProductView}
        />
      </div>
    </div>
  );
};

export default MarketplaceContent;
