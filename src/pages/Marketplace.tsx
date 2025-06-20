
import React from "react";
import MarketplaceWrapper from "@/components/marketplace/MarketplaceWrapper";
import { Helmet } from "react-helmet";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext";

const Marketplace = () => {
  return (
    <ProductProvider>
      <MainLayout>
        <Helmet>
          <title>Gift Marketplace | Find Perfect Gifts</title>
          <meta name="description" content="Browse thousands of thoughtful gifts for every occasion, interest, and relationship." />
        </Helmet>
        <div className="safe-area-top safe-area-bottom mobile-grid-optimized">
          <MarketplaceWrapper />
        </div>
      </MainLayout>
    </ProductProvider>
  );
};

export default Marketplace;
