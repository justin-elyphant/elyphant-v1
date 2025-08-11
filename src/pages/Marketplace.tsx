
import React, { useState, useEffect } from "react";
import StreamlinedMarketplaceWrapper from "@/components/marketplace/StreamlinedMarketplaceWrapper";
import { Helmet } from "react-helmet";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BulkGiftingModal from "@/components/marketplace/BulkGiftingModal";
import { useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { extractBudgetFromNicoleContext } from "@/services/marketplace/nicoleContextUtils";

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

    const handleNicoleSearch = async (event: CustomEvent) => {
      console.log('🎯 Marketplace: Enhanced Nicole search integration received:', event.detail);
      const { searchQuery, nicoleContext, query } = event.detail;
      const finalQuery = searchQuery || query;
      
      if (finalQuery) {
        try {
          // **PHASE 1: Import DirectNicoleMarketplaceService**
          const { directNicoleMarketplaceService } = await import('@/services/marketplace/DirectNicoleMarketplaceService');
          
          // **PHASE 7: Enhanced Context Storage**
          directNicoleMarketplaceService.storeNicoleContext(nicoleContext);
          
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.set('search', finalQuery);
          searchParams.set('source', 'nicole');

          if (nicoleContext) {
            // **PHASE 2: Unified Budget Handling**
            const { minPrice, maxPrice } = extractBudgetFromNicoleContext(nicoleContext as any);
            if (minPrice != null) searchParams.set('minPrice', String(minPrice));
            if (maxPrice != null) searchParams.set('maxPrice', String(maxPrice));

            // Add recipient/occasion if present
            if (nicoleContext.recipient) searchParams.set('recipient', String(nicoleContext.recipient));
            if (nicoleContext.occasion) searchParams.set('occasion', String(nicoleContext.occasion));

            // Include interests to help downstream mapping
            if (Array.isArray(nicoleContext.interests) && nicoleContext.interests.length > 0) {
              searchParams.set('interests', nicoleContext.interests.join(','));
            }

            // **PHASE 7: Enhanced Session Storage**
            try {
              sessionStorage.setItem('nicole-search-context', JSON.stringify({
                ...nicoleContext,
                timestamp: Date.now(),
                source: 'marketplace-integration'
              }));
              console.log('🎯 Marketplace: Enhanced Nicole context stored:', { minPrice, maxPrice, interests: nicoleContext.interests });
            } catch (e) {
              console.warn('🎯 Marketplace: Failed to persist Nicole context:', e);
            }
          }

          window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

          // **PHASE 1: Direct API Integration**
          console.log('🎯 Marketplace: Executing direct Nicole search');
          let directResults = [];
          
          try {
            directResults = await directNicoleMarketplaceService.searchWithNicoleContext(
              finalQuery,
              nicoleContext,
              { maxResults: 35 }
            );
            console.log(`🎯 Marketplace: Direct search found ${directResults.length} products`);
          } catch (searchError) {
            console.error('🎯 Marketplace: Direct search failed:', searchError);
          }

          // Dispatch enhanced event with direct results
          window.dispatchEvent(new CustomEvent('marketplace-search-updated', { 
            detail: { 
              searchTerm: finalQuery,
              nicoleContext,
              directResults,
              source: 'enhanced-nicole-integration'
            } 
          }));
        } catch (error) {
          console.error('🎯 Marketplace: Nicole search integration error:', error);
          
          // Fallback to basic integration
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.set('search', finalQuery);
          searchParams.set('source', 'nicole');
          window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
          
          window.dispatchEvent(new CustomEvent('marketplace-search-updated', { 
            detail: { 
              searchTerm: finalQuery,
              nicoleContext 
            } 
          }));
        }
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
    <CartProvider>
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
    </CartProvider>
  );
};

export default Marketplace;
