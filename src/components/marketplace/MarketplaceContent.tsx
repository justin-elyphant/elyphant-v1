
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid, { SavedFilters } from "./ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import FiltersSidebar from "./FiltersSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnhancedFilters } from "./hooks/useEnhancedFilters";
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
  searchTerm, 
  onProductView,
  showFilters,
  setShowFilters
}: MarketplaceContentProps) => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">(
    isMobile ? "list" : "grid"
  );
  const [savedFiltersActive, setSavedFiltersActive] = useState(false);
  const [savedFilters] = useLocalStorage<{name: string, filters: SavedFilters}[]>(
    "savedFilters", []
  );
  
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
    if (isMobile && viewMode === "grid") {
      setViewMode("list");
    }
  }, [isMobile]);
  
  // Initialize filters based on URL params
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      updateFilter('categories', [categoryParam]);
    }
  }, [searchParams, categories, updateFilter]);
  
  const toggleSavedFilters = () => {
    // If activating saved filters and we have at least one saved filter
    if (!savedFiltersActive && savedFilters.length > 0) {
      // Apply the first saved filter
      const firstSavedFilter = savedFilters[0];
      updateFilter('priceRange', firstSavedFilter.filters.priceRange);
      updateFilter('categories', firstSavedFilter.filters.categories);
      updateFilter('rating', firstSavedFilter.filters.ratings);
      updateFilter('favoritesOnly', firstSavedFilter.filters.favorites);
      
      toast.success(`Applied filter: ${firstSavedFilter.name}`, {
        description: "Your saved filter has been applied"
      });
    } else if (savedFiltersActive) {
      // Reset filters when turning off
      resetFilters();
    }
    
    setSavedFiltersActive(!savedFiltersActive);
  };
  
  if (isLoading) {
    return <MarketplaceLoading />;
  }
  
  // Decide whether to show recommendations
  const showRecommendations = filteredProducts.length === 0 && recommendations.length > 0;
  const displayProducts = showRecommendations ? recommendations : filteredProducts;
  
  return (
    <div className="mt-6">
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
      />
      
      <div className={`flex ${isMobile ? "flex-col" : "flex-col md:flex-row"} gap-6 mt-4`}>
        {showFilters && (
          <div className={`${isMobile ? "w-full" : "w-full md:w-72"} flex-shrink-0 ${isMobile ? "mb-4" : ""}`}>
            <FiltersSidebar
              activeFilters={filters}
              onFilterChange={(newFilters) => {
                // Update each filter type
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as keyof typeof filters, value);
                });
              }}
              categories={categories}
              isMobile={isMobile}
            />
          </div>
        )}
        
        <div className="flex-1">
          {searchTerm && filteredProducts.length === 0 && (
            <div className="mb-6 p-4 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No products match "{searchTerm}"</p>
                <p className="text-sm mt-1">Try using different keywords or browse our categories.</p>
                {recommendations.length > 0 && (
                  <p className="text-sm mt-1">Here are some recommendations that might interest you:</p>
                )}
              </div>
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
