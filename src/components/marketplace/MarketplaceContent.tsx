
import React, { useState } from "react";
import MarketplaceFilters from "./MarketplaceFilters";
import FiltersSidebar from "./FiltersSidebar";
import ProductGrid from "./ProductGrid";
import MarketplaceLoading from "./MarketplaceLoading";
import { Product } from "@/contexts/ProductContext";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
}

const MarketplaceContent = ({ products, isLoading }: MarketplaceContentProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {showFilters && (
        <div className="w-full md:w-1/4 space-y-6">
          <FiltersSidebar />
        </div>
      )}
      
      <div className={`w-full ${showFilters ? 'md:w-3/4' : 'w-full'}`}>
        <MarketplaceFilters 
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalItems={products.length}
        />
        
        {isLoading ? (
          <MarketplaceLoading />
        ) : (
          <ProductGrid 
            products={products} 
            viewMode={viewMode} 
          />
        )}
      </div>
    </div>
  );
};

export default MarketplaceContent;
