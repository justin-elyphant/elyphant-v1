
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
          <meta name="description" content="Discover thoughtful gifts for every occasion, interest, and relationship in your life." />
        </Helmet>
        <MarketplaceWrapper />
      </MainLayout>
    </ProductProvider>
  );
};

export default Marketplace;
