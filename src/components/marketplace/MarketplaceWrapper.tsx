
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import MarketplaceContent from "./MarketplaceContent";
import MarketplaceHeader from "./MarketplaceHeader";
import { useMarketplaceSearch } from "./hooks/useMarketplaceSearch";

const MarketplaceWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(!isMobile);

  const {
    currentCategory,
    filteredProducts,
    isLoading,
    getPageInfo
  } = useMarketplaceSearch();

  // Get search term from URL
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("search") || "";

  const handleProductView = (productId: string) => {
    console.log("Viewing product:", productId);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      
      <MarketplaceContent
        products={filteredProducts}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onProductView={handleProductView}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default MarketplaceWrapper;
