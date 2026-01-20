
import React, { useState, useEffect } from "react";
import StreamlinedMarketplaceWrapper from "@/components/marketplace/StreamlinedMarketplaceWrapper";
import { Helmet } from "react-helmet-async";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BulkGiftingModal from "@/components/marketplace/BulkGiftingModal";
import { useLocation, useParams } from "react-router-dom";
import PersonalizedMarketplace from "./PersonalizedMarketplace";

const Marketplace = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { recipientName } = useParams<{ recipientName: string }>();
  const [bulkGiftingOpen, setBulkGiftingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // If this is a personalized marketplace route, render PersonalizedMarketplace
  if (recipientName) {
    return <PersonalizedMarketplace />;
  }

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOpenBulkGifting = (event: CustomEvent) => {
      setSelectedProduct(event.detail.product);
      setBulkGiftingOpen(true);
    };

    const handleNicoleSearch = (event: CustomEvent) => {
      const { searchQuery, nicoleContext } = event.detail;
      if (searchQuery) {
        // Navigate to marketplace with search query
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('search', searchQuery);
        
        // Include budget in URL if provided via Nicole context
        if (nicoleContext) {
          const budget = nicoleContext.budget;
          // Support [min,max] array
          if (Array.isArray(budget) && budget.length === 2) {
            const [min, max] = budget;
            if (typeof min === 'number') searchParams.set('minPrice', String(min));
            if (typeof max === 'number') searchParams.set('maxPrice', String(max));
          }
          // Support { minPrice, maxPrice }
          else if (budget && typeof budget === 'object') {
            if (budget.minPrice !== undefined) searchParams.set('minPrice', String(budget.minPrice));
            if (budget.maxPrice !== undefined) searchParams.set('maxPrice', String(budget.maxPrice));
          }
          // Fallback: root-level minPrice/maxPrice
          if (nicoleContext.minPrice !== undefined) searchParams.set('minPrice', String(nicoleContext.minPrice));
          if (nicoleContext.maxPrice !== undefined) searchParams.set('maxPrice', String(nicoleContext.maxPrice));

          // Persist full Nicole context for richer filtering (interests, etc.)
          try {
            sessionStorage.setItem('nicole-search-context', JSON.stringify(nicoleContext));
            console.log('💰 Stored Nicole context with budget:', nicoleContext.budget);
          } catch (e) {
            console.warn('Failed to persist Nicole context to session storage', e);
          }
        }
        
        window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
        
        // Dispatch event to trigger search in marketplace components
        window.dispatchEvent(new CustomEvent('marketplace-search-updated', { 
          detail: { 
            searchTerm: searchQuery,
            nicoleContext 
          } 
        }));
      }
    };

    window.addEventListener('open-bulk-gifting', handleOpenBulkGifting as EventListener);
    window.addEventListener('nicole-search', handleNicoleSearch as EventListener);
    
    return () => {
      window.removeEventListener('open-bulk-gifting', handleOpenBulkGifting as EventListener);
      window.removeEventListener('nicole-search', handleNicoleSearch as EventListener);
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
