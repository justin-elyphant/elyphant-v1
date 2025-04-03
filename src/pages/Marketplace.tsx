
import React, { useEffect } from "react";
import { useMarketplaceSearch } from "@/components/marketplace/hooks/useMarketplaceSearch";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceContent from "@/components/marketplace/MarketplaceContent";
import { ProductProvider, useProducts } from "@/contexts/ProductContext";
import { useLocation } from "react-router-dom";

const Marketplace = () => {
  return (
    <ProductProvider>
      <MarketplaceWrapper />
    </ProductProvider>
  );
};

const MarketplaceWrapper = () => {
  const { filteredProducts, isLoading, getPageInfo } = useMarketplaceSearch();
  const { pageTitle, subtitle } = getPageInfo();
  const location = useLocation();
  const { products } = useProducts();
  
  useEffect(() => {
    console.log(`MarketplaceWrapper: Search params: ${location.search}, Products loaded: ${products.length}`);
  }, [location.search, products]);

  return (
    <div className="container mx-auto py-8 px-4">
      <MarketplaceHeader title={pageTitle} subtitle={subtitle} />
      <MarketplaceContent 
        products={filteredProducts} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default Marketplace;
