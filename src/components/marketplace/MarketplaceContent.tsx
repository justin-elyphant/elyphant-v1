import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useLocation } from "react-router-dom";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceFilters from "./MarketplaceFilters";
import FiltersSidebar from "./FiltersSidebar";
import ProductGrid from "./ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import { useFilteredProducts } from "./hooks/useFilteredProducts";
import { useMarketplaceProducts } from "./hooks/useMarketplaceProducts";
import MobileFiltersDrawer from "./MobileFiltersDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import SignUpDialog from "./SignUpDialog";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";
import { Product } from "@/types/product";
import BleedFirstLayout from "./BleedFirstLayout";

interface MarketplaceContentProps {
  products?: Product[];
  isLoading?: boolean;
  searchTerm?: string;
  onProductView?: (productId: string) => void;
  showFilters?: boolean;
  setShowFilters?: React.Dispatch<React.SetStateAction<boolean>>;
}

const MarketplaceContent = ({ 
  products: propProducts,
  isLoading: propIsLoading,
  searchTerm: propSearchTerm,
  onProductView,
  showFilters: propShowFilters,
  setShowFilters: propSetShowFilters
}: MarketplaceContentProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isMobile = useIsMobile();
  const query = searchParams.get("q") || propSearchTerm || "";
  
  // Check if this is a fresh navigation from home page
  const isFromHomePage = location.state?.fromHome || false;
  
  // Initialize state with proper boolean conversion, but reset if coming from home
  const [internalShowFilters, setInternalShowFilters] = useState(() => {
    if (isFromHomePage) return false; // Always start with filters closed from home
    const saved = localStorage.getItem('showFilters');
    return saved === 'true';
  });
  
  const showFilters = propShowFilters !== undefined ? propShowFilters : internalShowFilters;
  const setShowFilters = propSetShowFilters || setInternalShowFilters;
  
  const [savedFiltersActive, setSavedFiltersActive] = useState(() => {
    if (isFromHomePage) return false; // Don't use saved filters from home
    const saved = localStorage.getItem('savedFiltersActive');
    return saved === 'true';
  });
  
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  // Active filters state - reset to defaults if coming from home
  const [activeFilters, setActiveFilters] = useState(() => {
    if (isFromHomePage) {
      // Always start with clean filters from home page
      return {
        categories: [] as string[],
        priceRange: [0, 1000] as [number, number],
        rating: 0,
        inStock: false,
        onSale: false,
        freeShipping: false,
        brands: [] as string[],
        occasion: "",
      };
    }
    
    // Otherwise use saved state
    return {
      categories: [] as string[],
      priceRange: [0, 1000] as [number, number],
      rating: 0,
      inStock: false,
      onSale: false,
      freeShipping: false,
      brands: [] as string[],
      occasion: "",
    };
  });

  // Use optimized search hook
  const { search: optimizedSearch, isLoading: searchLoading, results: searchResults, error: searchError } = useOptimizedSearch();

  // Regular product fetching (when no search query and no props provided)
  const { products: regularProducts, isLoading: regularLoading } = useMarketplaceProducts();

  // Determine which products to use - prioritize props, then search results, then regular products
  const products = useMemo(() => {
    if (propProducts) {
      return propProducts;
    }
    if (query && searchResults.length > 0) {
      return searchResults;
    }
    return regularProducts || [];
  }, [propProducts, query, searchResults, regularProducts]);

  // Determine loading state
  const isLoading = propIsLoading !== undefined ? propIsLoading : (query ? searchLoading : regularLoading);

  // Filter products based on active filters
  const filteredProducts = useFilteredProducts(products, activeFilters, sortOption);

  // Categories for filters
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet);
  }, [products]);

  // Handle search when query changes
  useEffect(() => {
    if (query.trim()) {
      console.log(`MarketplaceContent: Triggering optimized search for "${query}"`);
      optimizedSearch(query, 50);
    }
  }, [query, optimizedSearch]);

  // Save filter state to localStorage (only for internal state and not from home)
  useEffect(() => {
    if (propShowFilters === undefined && !isFromHomePage) {
      localStorage.setItem('showFilters', internalShowFilters.toString());
    }
  }, [internalShowFilters, propShowFilters, isFromHomePage]);

  useEffect(() => {
    if (!isFromHomePage) {
      localStorage.setItem('savedFiltersActive', savedFiltersActive.toString());
    }
  }, [savedFiltersActive, isFromHomePage]);

  // Clear the fromHome state after initial load to allow normal behavior
  useEffect(() => {
    if (isFromHomePage) {
      // Replace the current history entry to remove the fromHome state
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }, [isFromHomePage]);

  const handleFilterChange = (newFilters: typeof activeFilters) => {
    setActiveFilters(newFilters);
  };

  const handleSavedFiltersToggle = () => {
    setSavedFiltersActive(!savedFiltersActive);
  };

  const handleProductView = (productId: string) => {
    if (onProductView) {
      onProductView(productId);
    }
  };

  if (isLoading) {
    return <MarketplaceLoading />;
  }

  if (searchError) {
    console.error('Search error:', searchError);
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <BleedFirstLayout>
          <MarketplaceHeader />
          
          <div className="py-6">
            <MarketplaceFilters
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortOption={sortOption}
              onSortChange={setSortOption}
              isMobile={isMobile}
              savedFiltersCount={0}
              onSavedFiltersToggle={handleSavedFiltersToggle}
              savedFiltersActive={savedFiltersActive}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
            
            <div className="flex gap-6">
              {/* Desktop Filters Sidebar */}
              {!isMobile && showFilters && (
                <div className="w-64 flex-shrink-0">
                  <FiltersSidebar
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    categories={categories}
                  />
                </div>
              )}
              
              {/* Product Grid */}
              <div className="flex-1">
                <ProductGrid 
                  products={filteredProducts} 
                  viewMode={viewMode}
                  onProductView={handleProductView}
                />
              </div>
            </div>
          </div>
        </BleedFirstLayout>
        
        {/* Mobile Filters Drawer */}
        <MobileFiltersDrawer
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          categories={categories}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      </div>
      
      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default MarketplaceContent;
