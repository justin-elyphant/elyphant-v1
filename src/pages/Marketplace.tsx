
import React, { useState, useEffect } from "react";
import StreamlinedMarketplaceWrapper from "@/components/marketplace/StreamlinedMarketplaceWrapper";
import { Helmet } from "react-helmet";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BulkGiftingModal from "@/components/marketplace/BulkGiftingModal";
import { useLocation } from "react-router-dom";

const Marketplace = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [bulkGiftingOpen, setBulkGiftingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

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
      <MainLayout>
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
      </MainLayout>
    </ProductProvider>
  );
};

export default Marketplace;
