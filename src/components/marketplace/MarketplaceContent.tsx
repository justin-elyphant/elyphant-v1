import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid, { SavedFilters } from "./ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import FiltersSidebar from "./FiltersSidebar";
import MobileFiltersDrawer from "./MobileFiltersDrawer";
import BleedFirstLayout from "./BleedFirstLayout";
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  const [savedFiltersActive, setSavedFiltersActive] = useState(false);
  const [savedFilters] = useLocalStorage<{name: string, filters: SavedFilters}[]>(
    "savedFilters", []
  );
  const [showFullWishlist, setShowFullWishlist] = useState(false);
  
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
  
  const handleFilterChange = (newFilters: Record<string, any>) => {
    // If toggling showFullWishlist, reload products
    if ("showFullWishlist" in newFilters) {
      setShowFullWishlist(newFilters.showFullWishlist);
    }
    // Existing filter updates
    Object.entries(newFilters).forEach(([key, value]) => {
      updateFilter(key as keyof typeof filters, value);
    });
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
        {/* Desktop Sidebar Filters */}
        {!isMobile && showFilters && (
          <div className="w-full md:w-72 flex-shrink-0 px-4">
            <FiltersSidebar
              activeFilters={filters}
              onFilterChange={handleFilterChange}
              categories={categories}
              isMobile={false}
            />
          </div>
        )}
        
        {/* Mobile Filters Drawer */}
        {isMobile && (
          <div className="px-4 mb-4">
            <MobileFiltersDrawer
              activeFilters={filters}
              onFilterChange={handleFilterChange}
              categories={categories}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
          </div>
        )}
        
        {/* Products Grid - Full bleed on mobile, generous margins on desktop */}
        <div className={`flex-1 ${isMobile ? '' : 'px-4'}`}>
          {searchTerm && filteredProducts.length === 0 && (
            <div className={`mb-6 p-4 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-3 text-amber-800 ${isMobile ? 'mx-4' : ''}`}>
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
          
          <div className={isMobile ? 'px-2' : ''}>
            <ProductGrid 
              products={displayProducts} 
              viewMode={viewMode}
              sortOption={filters.sortBy}
              onProductView={onProductView}
            />
          </div>
        </div>
      </div>
    </BleedFirstLayout>
  );
};

export default MarketplaceContent;
