
import React, { useState } from "react";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceContent from "./MarketplaceContent";
import { useMarketplaceSearch } from "./hooks/useMarketplaceSearch";
import StickyFiltersBar from "./StickyFiltersBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";

const MarketplaceWrapper = () => {
  const [showFilters, setShowFilters] = useState(true);
  const { currentCategory, filteredProducts, isLoading, getPageInfo } = useMarketplaceSearch();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get search term from URL
  const searchTerm = searchParams.get("search") || "";
  
  const pageInfo = getPageInfo();
  
  // Track product view analytics
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
    // In a real implementation, you would track this with an analytics service
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader currentCategory={currentCategory} />
      
      <StickyFiltersBar 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        totalItems={filteredProducts.length}
        searchTerm={searchTerm}
      />
      
      <main className={`container mx-auto px-4 ${isMobile ? 'pb-20' : 'pb-12'}`}>
        <MarketplaceContent 
          products={filteredProducts}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onProductView={handleProductView}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      </main>
    </div>
  );
};

export default MarketplaceWrapper;
