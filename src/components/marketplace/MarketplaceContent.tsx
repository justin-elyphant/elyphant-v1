
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid from "./ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import FiltersSidebar from "./FiltersSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnhancedFilters } from "./hooks/useEnhancedFilters";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
  searchTerm?: string;
  onProductView?: (productId: string) => void;
}

const MarketplaceContent = ({ products, isLoading, searchTerm, onProductView }: MarketplaceContentProps) => {
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMobile ? "list" : "grid");
  
  // Use our enhanced filters hook
  const {
    filters,
    filteredProducts,
    categories,
    updateFilter,
    resetFilters
  } = useEnhancedFilters(products);
  
  // Get recommendations (will be used if we have few or no search results)
  const { recommendations } = useProductRecommendations();
  
  // Force list view on mobile devices when screen size changes
  useEffect(() => {
    if (isMobile) {
      setViewMode("list");
    }
  }, [isMobile]);
  
  if (isLoading) {
    return <MarketplaceLoading />;
  }
  
  // Decide whether to show recommendations
  const showRecommendations = filteredProducts.length === 0 && recommendations.length > 0;
  const displayProducts = showRecommendations ? recommendations : filteredProducts;
  
  return (
    <div className="mt-6">
      <MarketplaceFilters 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        viewMode={viewMode}
        setViewMode={(mode: "grid" | "list") => {
          // Only allow changing view mode on desktop
          if (!isMobile) {
            setViewMode(mode);
          }
        }}
        totalItems={filteredProducts.length}
        sortOption={filters.sortBy}
        onSortChange={(option) => updateFilter('sortBy', option)}
        isMobile={isMobile}
      />
      
      <div className={`flex ${isMobile ? "flex-col" : "flex-col md:flex-row"} gap-6 mt-4`}>
        {showFilters && (
          <div className={`${isMobile ? "w-full" : "w-full md:w-64"} flex-shrink-0 ${isMobile ? "mb-4" : ""}`}>
            <FiltersSidebar
              activeFilters={filters}
              onFilterChange={(newFilters) => {
                // Update each filter type
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as keyof typeof filters, value);
                });
              }}
              categories={categories}
            />
          </div>
        )}
        
        <div className="flex-1">
          {showRecommendations && (
            <div className="mb-4 p-4 bg-purple-50 rounded-md border border-purple-100">
              <p className="text-sm text-purple-800">No products match your current search criteria. 
              Here are some recommendations that might interest you:</p>
            </div>
          )}
          
          <ProductGrid 
            products={displayProducts} 
            viewMode={viewMode}
            sortOption={filters.sortBy}
            onProductView={onProductView}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketplaceContent;
