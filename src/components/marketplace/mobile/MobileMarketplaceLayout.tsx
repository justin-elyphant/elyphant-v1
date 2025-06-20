
import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product } from "@/types/product";
import MobileProductGrid from "./MobileProductGrid";
import MobileFilterBottomSheet from "./MobileFilterBottomSheet";
import MobileSearchHeader from "./MobileSearchHeader";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MobileMarketplaceLayoutProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onProductView: (productId: string) => void;
  error?: string | null;
  onRefresh?: () => void;
}

const MobileMarketplaceLayout = ({
  products,
  isLoading,
  searchTerm,
  onProductView,
  error,
  onRefresh
}: MobileMarketplaceLayoutProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState("relevance");
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const getProductStatus = (product: Product) => {
    if (product.isBestSeller) {
      return { badge: "Best Seller", color: "bg-amber-100 text-amber-800" };
    }
    if (product.tags?.includes("new")) {
      return { badge: "New", color: "bg-green-100 text-green-800" };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Search Header */}
      <MobileSearchHeader searchTerm={searchTerm} />

      {/* Filter Toggle Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 safe-area-inset">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 h-9 px-3 relative"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 text-white"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20 safe-area-bottom">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-red-200 rounded-lg"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : (
          <MobileProductGrid
            products={products}
            onProductClick={onProductView}
            getProductStatus={getProductStatus}
            isLoading={isLoading}
            hasMore={false}
            onRefresh={onRefresh}
          />
        )}
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterBottomSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        products={products}
        sortOption={sortOption}
        setSortOption={setSortOption}
        onFiltersChange={(count) => setActiveFilterCount(count)}
      />
    </div>
  );
};

export default MobileMarketplaceLayout;
