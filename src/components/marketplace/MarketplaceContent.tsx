
import React, { useState } from "react";
import { Product } from "@/types/product";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid from "./ProductGrid";  // Updated import path to use the main ProductGrid component
import MarketplaceLoading from "./MarketplaceLoading";
import FiltersSidebar from "./FiltersSidebar";

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
  
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setActiveFilters(newFilters);
  };

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
  
  return (
    <div className="mt-6">
      <MarketplaceFilters 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        viewMode={viewMode}
        setViewMode={(mode: "grid" | "list") => setViewMode(mode)}
        totalItems={filteredProducts.length}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />
      
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {showFilters && (
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
    </div>
  );
};

export default MarketplaceContent;
