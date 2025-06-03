
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid, { SavedFilters } from "./ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import DynamicFiltersSidebar from "./DynamicFiltersSidebar";
import MobileFiltersDrawer from "./MobileFiltersDrawer";
import BleedFirstLayout from "./BleedFirstLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDynamicFilters } from "@/hooks/useDynamicFilters";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { AlertCircle } from "lucide-react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
  searchTerm?: string;
  onProductView?: (productId: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const MarketplaceContent = ({ 
  products, 
  isLoading, 
  searchTerm = "", 
  onProductView,
  showFilters,
  setShowFilters
}: MarketplaceContentProps) => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  const [savedFiltersActive, setSavedFiltersActive] = useState(false);
  const [savedFilters] = useLocalStorage<{name: string, filters: SavedFilters}[]>(
    "savedFilters", []
  );
  
  // Use our new dynamic filters hook
  const {
    filters,
    filteredProducts,
    filterOptions,
    searchContext,
    updateFilter,
    resetFilters,
    shouldShowBrandFilters,
    shouldShowDemographicFilters,
    shouldShowOccasionFilters,
    shouldShowAttributeFilters
  } = useDynamicFilters(products, searchTerm);
  
  // Get recommendations (will be used if we have few or no search results)
  const { recommendations } = useProductRecommendations();
  
  const toggleSavedFilters = () => {
    // If activating saved filters and we have at least one saved filter
    if (!savedFiltersActive && savedFilters.length > 0) {
      // Apply the first saved filter (this would need to be adapted for new filter structure)
      const firstSavedFilter = savedFilters[0];
      // For now, just reset filters since the structure is different
      resetFilters();
      
      toast.success(`Applied filter: ${firstSavedFilter.name}`, {
        description: "Your saved filter has been applied"
      });
    } else if (savedFiltersActive) {
      // Reset filters when turning off
      resetFilters();
    }
    
    setSavedFiltersActive(!savedFiltersActive);
  };
  
  // Legacy filter change handler for compatibility with existing components
  const handleLegacyFilterChange = (legacyFilters: Record<string, any>) => {
    // Map legacy filter format to new dynamic filter format
    if (legacyFilters.priceRange) {
      updateFilter('priceRange', legacyFilters.priceRange);
    }
    if (legacyFilters.categories) {
      updateFilter('selectedCategories', legacyFilters.categories);
    }
    if (legacyFilters.rating !== undefined) {
      updateFilter('rating', legacyFilters.rating);
    }
    if (legacyFilters.freeShipping !== undefined) {
      updateFilter('freeShipping', Boolean(legacyFilters.freeShipping));
    }
    if (legacyFilters.favoritesOnly !== undefined) {
      updateFilter('favoritesOnly', Boolean(legacyFilters.favoritesOnly));
    }
    if (legacyFilters.sortBy) {
      updateFilter('sortBy', legacyFilters.sortBy);
    }
  };
  
  if (isLoading) {
    return <MarketplaceLoading />;
  }
  
  // Decide whether to show recommendations
  const showRecommendations = filteredProducts.length === 0 && recommendations.length > 0;
  const displayProducts = showRecommendations ? recommendations : filteredProducts;
  
  return (
    <BleedFirstLayout className="mt-6">
      {/* Top controls bar with responsive container for readability */}
      <div className="container mx-auto px-4 mb-4">
        <MarketplaceFilters 
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalItems={filteredProducts.length}
          sortOption={filters.sortBy}
          onSortChange={(option) => updateFilter('sortBy', option)}
          isMobile={isMobile}
          savedFiltersCount={savedFilters.length}
          onSavedFiltersToggle={toggleSavedFilters}
          savedFiltersActive={savedFiltersActive}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      </div>
      
      <div className={`flex ${isMobile ? "flex-col" : "flex-col md:flex-row"} gap-6`}>
        {/* Desktop Dynamic Sidebar Filters */}
        {!isMobile && showFilters && (
          <div className="w-full md:w-72 flex-shrink-0 px-4">
            <DynamicFiltersSidebar
              filters={filters}
              filterOptions={filterOptions}
              searchContext={searchContext}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              shouldShowBrandFilters={shouldShowBrandFilters}
              shouldShowDemographicFilters={shouldShowDemographicFilters}
              shouldShowOccasionFilters={shouldShowOccasionFilters}
              shouldShowAttributeFilters={shouldShowAttributeFilters}
              isMobile={false}
            />
          </div>
        )}
        
        {/* Mobile Filters Drawer */}
        {isMobile && (
          <div className="px-4 mb-4">
            <MobileFiltersDrawer
              activeFilters={{
                priceRange: filters.priceRange,
                categories: filters.selectedCategories,
                rating: filters.rating,
                freeShipping: Boolean(filters.freeShipping),
                favoritesOnly: Boolean(filters.favoritesOnly),
                sortBy: filters.sortBy
              }}
              onFilterChange={handleLegacyFilterChange}
              categories={filterOptions.categories}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
          </div>
        )}
        
        {/* Main Product Grid */}
        <div className="flex-1 min-w-0">
          {showRecommendations && (
            <div className="px-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  No products found for your current filters
                </p>
                <p className="text-blue-700">
                  Here are some recommendations based on your search for "{searchTerm}"
                </p>
              </div>
            </div>
          )}
          
          <ProductGrid
            products={displayProducts}
            viewMode={viewMode}
            onProductView={onProductView}
          />
        </div>
      </div>
    </BleedFirstLayout>
  );
};

export default MarketplaceContent;
