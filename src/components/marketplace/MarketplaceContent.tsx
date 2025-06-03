
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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

const MarketplaceContent = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const query = searchParams.get("q") || "";
  
  // Initialize state with proper boolean conversion
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem('showFilters');
    return saved === 'true';
  });
  const [savedFiltersActive, setSavedFiltersActive] = useState(() => {
    const saved = localStorage.getItem('savedFiltersActive');
    return saved === 'true';
  });
  
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  // Active filters state
  const [activeFilters, setActiveFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 1000] as [number, number],
    rating: 0,
    inStock: false,
    onSale: false,
    freeShipping: false,
    brands: [] as string[],
    occasion: "",
  });

  // Use optimized search hook
  const { search: optimizedSearch, isLoading: searchLoading, results: searchResults, error: searchError } = useOptimizedSearch();

  // Regular product fetching (when no search query)
  const { data: regularProducts, isLoading: regularLoading } = useMarketplaceProducts(!query);

  // Determine which products to use
  const products = useMemo(() => {
    if (query && searchResults.length > 0) {
      return searchResults;
    }
    return regularProducts || [];
  }, [query, searchResults, regularProducts]);

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

  // Save filter state to localStorage
  useEffect(() => {
    localStorage.setItem('showFilters', showFilters.toString());
  }, [showFilters]);

  useEffect(() => {
    localStorage.setItem('savedFiltersActive', savedFiltersActive.toString());
  }, [savedFiltersActive]);

  const handleFilterChange = (newFilters: typeof activeFilters) => {
    setActiveFilters(newFilters);
  };

  const handleSavedFiltersToggle = () => {
    setSavedFiltersActive(!savedFiltersActive);
  };

  const isLoading = query ? searchLoading : regularLoading;

  if (isLoading) {
    return <MarketplaceLoading />;
  }

  if (searchError) {
    console.error('Search error:', searchError);
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <MarketplaceHeader onSignUpRequired={() => setShowSignUpDialog(true)} />
        
        <div className="container mx-auto px-4 py-6">
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
                onSignUpRequired={() => setShowSignUpDialog(true)}
              />
            </div>
          </div>
        </div>
        
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
