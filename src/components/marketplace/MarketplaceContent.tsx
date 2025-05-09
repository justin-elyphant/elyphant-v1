
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid from "./product-grid/ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import FiltersSidebar from "./FiltersSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
  searchTerm?: string;
  onProductView?: (productId: string) => void;
}

const MarketplaceContent = ({ products, isLoading, searchTerm, onProductView }: MarketplaceContentProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const isMobile = useIsMobile();
  
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setActiveFilters(newFilters);
    
    // On mobile, close the filter drawer when filters are applied
    if (isMobile && Object.keys(newFilters).length === 0) {
      setShowMobileFilters(false);
    }
  };
  
  // When showFilters changes and we're on mobile, toggle mobile filters
  useEffect(() => {
    if (isMobile && showFilters) {
      setShowMobileFilters(true);
    }
  }, [showFilters, isMobile]);

  // Filter products based on activeFilters
  const filteredProducts = products.filter(product => {
    // Price filter
    if (activeFilters.price) {
      const price = product.price;
      if (activeFilters.price === "under25" && price >= 25) return false;
      if (activeFilters.price === "25to50" && (price < 25 || price > 50)) return false;
      if (activeFilters.price === "50to100" && (price < 50 || price > 100)) return false;
      if (activeFilters.price === "over100" && price <= 100) return false;
    }
    
    // Free shipping filter
    if (activeFilters.freeShipping && !(product as any).free_shipping) return false;
    
    // Color filter (if we have color data)
    if (activeFilters.color && (product as any).color && (product as any).color !== activeFilters.color) return false;
    
    return true;
  });
  
  if (isLoading) {
    return <MarketplaceLoading />;
  }
  
  // Handle show/hide filters on mobile
  const handleToggleFilters = () => {
    if (isMobile) {
      setShowMobileFilters(!showMobileFilters);
      setShowFilters(true);
    } else {
      setShowFilters(!showFilters);
    }
  };
  
  // Render filters sidebar based on device type
  const renderFilters = () => {
    if (isMobile) {
      return (
        <Drawer open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <DrawerContent className="px-4 pb-6 max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
            </DrawerHeader>
            <FiltersSidebar
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClose={() => setShowMobileFilters(false)}
            />
          </DrawerContent>
        </Drawer>
      );
    } else if (showFilters) {
      return (
        <div className="w-full md:w-64 flex-shrink-0">
          <FiltersSidebar
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="mt-6">
      <MarketplaceFilters 
        showFilters={showFilters}
        setShowFilters={handleToggleFilters}
        viewMode={viewMode}
        setViewMode={(mode: "grid" | "list") => setViewMode(mode)}
        totalItems={filteredProducts.length}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />
      
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {!isMobile && showFilters && (
          <div className="w-full md:w-64 flex-shrink-0">
            <FiltersSidebar
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
        
        <div className="flex-1">
          <ProductGrid 
            products={filteredProducts} 
            viewMode={viewMode}
            sortOption={sortOption}
            onProductView={onProductView}
          />
        </div>
      </div>
      
      {renderFilters()}
    </div>
  );
};

export default MarketplaceContent;
