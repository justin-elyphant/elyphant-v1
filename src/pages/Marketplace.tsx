
import React from "react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useLocation, useSearchParams } from "react-router-dom";
import { MarketplaceWrapper } from "@/components/marketplace/MarketplaceWrapper";

const Marketplace = () => {
  return (
    <ProductProvider>
      <MarketplaceWrapper />
    </ProductProvider>
  );
};

export default Marketplace;
