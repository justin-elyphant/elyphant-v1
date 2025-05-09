
import React, { useEffect } from "react";
import { useMarketplaceProducts } from "./hooks/useMarketplaceProducts";
import { useProductTracking } from "./hooks/useProductTracking";
import { useSearchParams } from "react-router-dom";

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
  const { trackProductView } = useProductTracking(products);
  const [searchParams] = useSearchParams();
  
  // Track product view when component mounts or URL parameters change
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      console.log("MarketplaceWrapper: Tracking product view for ID:", productId);
      trackProductView(productId);
    }
  }, [searchParams, products]);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
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
        onProductView={trackProductView}
      />
      
      {/* Recently viewed products section */}
      <RecentlyViewedProducts />
    </div>
  );
};

export default MarketplaceWrapper;
