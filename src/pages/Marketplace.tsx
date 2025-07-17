
import React, { useState, useEffect } from "react";
import MarketplaceWrapper from "@/components/marketplace/MarketplaceWrapper";
import StreamlinedMarketplaceWrapper from "@/components/marketplace/StreamlinedMarketplaceWrapper";
import { Helmet } from "react-helmet";

import { ProductProvider } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BulkGiftingModal from "@/components/marketplace/BulkGiftingModal";

const Marketplace = () => {
  const isMobile = useIsMobile();
  const [bulkGiftingOpen, setBulkGiftingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const handleOpenBulkGifting = (event: CustomEvent) => {
      setSelectedProduct(event.detail.product);
      setBulkGiftingOpen(true);
    };

    window.addEventListener('open-bulk-gifting', handleOpenBulkGifting as EventListener);
    return () => {
      window.removeEventListener('open-bulk-gifting', handleOpenBulkGifting as EventListener);
    };
  }, []);

  return (
    <ProductProvider>
      <Helmet>
        <title>Gift Marketplace | Find Perfect Gifts</title>
        <meta name="description" content="Browse thousands of thoughtful gifts for every occasion, interest, and relationship." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </Helmet>
      <div className={`min-h-screen bg-gray-50 ${isMobile ? 'safe-area-inset pb-safe' : ''}`}>
        <StreamlinedMarketplaceWrapper />
      </div>
      
      {/* Bulk Gifting Modal */}
      <BulkGiftingModal
        open={bulkGiftingOpen}
        onOpenChange={setBulkGiftingOpen}
        initialProduct={selectedProduct}
      />
    </ProductProvider>
  );
};

export default Marketplace;
