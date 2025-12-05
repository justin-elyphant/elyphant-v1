
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
import { useSmartFilters } from "@/hooks/useSmartFilters";
import { SortByOption } from "@/types/filters";

interface MarketplaceContentProps {
  searchTerm: string;
  onProductView: (productId: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onRefresh?: () => void;
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const MarketplaceContent = ({
  searchTerm,
  onProductView,
  showFilters,
  setShowFilters,
  onRefresh,
  products,
  isLoading,
  error,
}: MarketplaceContentProps) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortByOption>('relevance');
  
  // Use smart filters for UI state (server does actual filtering)
  const { filters, detectedCategory, hasFilters } = useSmartFilters(searchTerm, products);
  
  // Calculate available categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.category) categories.add(product.category);
    });
    return Array.from(categories);
  }, [products]);

  // Use mobile layout for mobile devices
  if (isMobile) {
    return (
      <MobileMarketplaceLayout
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onProductView={onProductView}
        error={error}
        onRefresh={onRefresh}
      />
    );
  }

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
        <ProductSkeleton count={12} viewMode={viewMode} />
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
            filters={{ 
              sortBy,
              priceRange: { min: 0, max: 1000 },
              categories: [],
              brands: [],
              rating: null,
              availability: 'all' as const
            }}
            availableCategories={availableCategories}
            activeFilterCount={hasFilters ? 1 : 0}
            onUpdateFilters={(updates) => {
              if (updates.sortBy) {
                setSortBy(updates.sortBy as SortByOption);
              }
            }}
            onClearFilters={() => setSortBy('relevance')}
          />
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-space-loose">
            <MarketplaceToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortOption={sortBy}
              setSortOption={(option: string) => setSortBy(option as SortByOption)}
              totalItems={products.length}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              isMobile={isMobile}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>

          {/* Product Grid */}
          <div className="relative">
            <ProductGrid
              products={products}
              viewMode={viewMode}
              sortOption={sortBy}
              onProductView={onProductView}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceContent;
