
import React from "react";
import MarketplaceWrapper from "@/components/marketplace/MarketplaceWrapper";
import { Helmet } from "react-helmet";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { ProductProvider } from "@/contexts/ProductContext";

const Marketplace = () => {
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <title>Gift Marketplace | Find Perfect Gifts</title>
          <meta name="description" content="Discover thoughtful gifts for every occasion, interest, and relationship in your life." />
        </Helmet>
        <Header />
        <main className="flex-grow">
          <MarketplaceWrapper />
        </main>
        <Footer />
      </div>
    </ProductProvider>
  );
};

export default Marketplace;
