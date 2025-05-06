
import React from "react";
import MarketplaceWrapper from "@/components/marketplace/MarketplaceWrapper";
import { Helmet } from "react-helmet";

const Marketplace = () => {
  return (
    <>
      <Helmet>
        <title>Gift Marketplace | Find Perfect Gifts</title>
        <meta name="description" content="Discover thoughtful gifts for every occasion, interest, and relationship in your life." />
      </Helmet>
      <MarketplaceWrapper />
    </>
  );
};

export default Marketplace;
