
import React from "react";
import { useMarketplaceProducts } from "./hooks/useMarketplaceProducts";
import { useProductTracking } from "./hooks/useProductTracking";

import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import MarketplaceContent from "./MarketplaceContent";
import RecentlyViewedProducts from "./RecentlyViewedProducts";

const MarketplaceWrapper = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch 
  } = useMarketplaceProducts();
  
  // Initialize product tracking
  useProductTracking(products);

  return (
    <div className="container mx-auto px-4 py-8">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearch={onSearch} 
      />
      
      {/* Compact categories section always visible */}
      <GiftingCategories />
      
      <MarketplaceContent 
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
      
      {/* Recently viewed products section */}
      <RecentlyViewedProducts />
    </div>
  );
};

export default MarketplaceWrapper;
