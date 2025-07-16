
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import IntegratedSearchSection from "./IntegratedSearchSection";
import SubtleCountdownBanner from "./SubtleCountdownBanner";
import ResultsSummaryBar from "./ResultsSummaryBar";
import MarketplaceErrorBoundary from "./error/ErrorBoundary";
// TEMPORARILY DISABLED: NicoleMarketplaceWidget - Re-enable when technical issues are resolved
// import NicoleMarketplaceWidget from "@/components/ai/marketplace/NicoleMarketplaceWidget";
import ConnectionIntegration from "./integration/ConnectionIntegration";
import EventsAwareHeader from "./integration/EventsAwareHeader";
import LoadingFallback from "@/components/common/LoadingFallback";
import { useRetry } from "@/hooks/common/useRetry";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useAuth } from "@/contexts/auth";
import { useProducts } from "@/contexts/ProductContext";
import { useEnhancedMarketplaceSearch } from "./hooks/useEnhancedMarketplaceSearch";
import { toast } from "sonner";
import { FullWidthSection } from "@/components/layout/FullWidthSection";

const MarketplaceWrapper = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addSearch } = useUserSearchHistory();
  const { user } = useAuth();

  // Check if this is a fresh navigation from home page or Nicole
  const isFromHomePage = location.state?.fromHome || false;
  const isFromNicole = location.state?.fromNicole || false;

  // Initialize showFilters state - always default to false
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use Enhanced Zinc API System for product management
  const { products } = useProducts();
  const {
    isLoading,
    error,
    filteredProducts
  } = useEnhancedMarketplaceSearch(1);
  
  // Enhanced retry mechanism for failed operations
  const { execute: executeWithRetry, isRetrying } = useRetry({
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  });

  // TEMPORARILY DISABLED: Nicole widget state - Re-enable when technical issues are resolved
  // const [isNicoleOpen, setIsNicoleOpen] = useState(false);

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  const resultsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string | null>(null);

  // Clear the fromHome state after initial load to allow normal behavior
  useEffect(() => {
    if (isFromHomePage || isFromNicole) {
      // Replace the current history entry to remove the fromHome/fromNicole state
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }, [isFromHomePage, isFromNicole]);

  // Mark as no longer initial load after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Close filters on mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowFilters(false);
    }
  }, [isMobile]);

  // Only show filters when there are active search parameters AND user manually interacts
  useEffect(() => {
    const hasActiveSearch = Boolean(searchTerm || categoryParam || brandParam);
    
    // Never auto-show filters - only show when user explicitly requests them
    // Reset to false when there are no search parameters
    if (!hasActiveSearch) {
      setShowFilters(false);
    }
    // Note: Removed auto-show logic for desktop with active search parameters
  }, [searchTerm, categoryParam, brandParam, isMobile, isInitialLoad]);

  // Clean up conflicting URL parameters and dismiss lingering toasts
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let shouldUpdate = false;

    // If both search and category exist, prioritize search and clear category
    if (searchTerm && categoryParam) {
      console.log('Detected conflicting search and category params, prioritizing search');
      params.delete("category");
      shouldUpdate = true;
    }

    // Enhanced toast cleanup - dismiss any brand or category related toasts
    const allBrands = ["Apple", "Nike", "Lululemon", "Made In", "Stanley", "Lego"];
    allBrands.forEach(brand => {
      toast.dismiss(`brand-loading-${brand}`);
      toast.dismiss(`brand-loading-${brand.toLowerCase()}`);
    });

    const allCategories = ["electronics", "fashion", "home", "sports", "gaming", "beauty", "baby", "kitchen", "books", "music"];
    allCategories.forEach(category => {
      toast.dismiss(`category-search-${category}`);
    });

    if (shouldUpdate) {
      setSearchParams(params, { replace: true });
    }
  }, [searchTerm, categoryParam, setSearchParams]);

  // Enhanced toast dismissal for search scenarios
  useEffect(() => {
    // Enhanced toast dismissal for all specific scenarios
    if (categoryParam && !searchTerm) {
      toast.dismiss(`category-search-${categoryParam}`);
    }
    if (brandParam) {
      toast.dismiss(`brand-loading-${brandParam}`);
    }
    if (searchTerm) {
      // Dismiss any search-related toasts
      toast.dismiss("search-loading");
      toast.dismiss("search-error");
    }
  }, [searchTerm, categoryParam, brandParam]);
  
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
  };

  const hasActiveSearch = Boolean(searchTerm || categoryParam || brandParam);

  // Auto-scroll to results on search/filter changes (but not on initial load from external navigation)
  useEffect(() => {
    if (hasActiveSearch && resultsRef.current && !isInitialLoad) {
      const currentSearchKey = `${searchTerm}|${categoryParam}|${brandParam}`;
      if (lastSearchRef.current !== currentSearchKey) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        lastSearchRef.current = currentSearchKey;
      }
    }
  }, [searchTerm, categoryParam, brandParam, hasActiveSearch, isInitialLoad]);

  // Add to search history (only for actual searches, not category selections)
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const isFromOccasion = location.state?.fromOccasion || false;
      
      if (!isFromOccasion) {
        addSearch(searchTerm.trim(), false);
      }
    }
  }, [searchTerm, addSearch, location.state]);

  const handleRecentSearchClick = (term: string) => {
    // Dismiss all toasts before new search
    toast.dismiss();
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    // Clear category when doing a search
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
  };

  const handleRefresh = async () => {
    // Enhanced refresh with retry mechanism - reload the page to reset the Enhanced Zinc API system
    window.location.reload();
  };

  // Enhanced: Handle connection selection for gifting context
  const handleConnectionSelect = (connectionId: string, name: string) => {
    console.log('Selected connection for gifting:', { connectionId, name });
    
    // Set search context for the selected person
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", `gifts for ${name}`);
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
    
    toast.success(`Finding gifts for ${name}`, {
      description: "Searching for personalized recommendations"
    });
  };

  // TEMPORARILY DISABLED: Nicole search suggestion handler - Re-enable when technical issues are resolved
  // const handleNicoleSearchSuggestion = (query: string) => {
  //   const newParams = new URLSearchParams(searchParams);
  //   newParams.set("search", query);
  //   newParams.delete("category");
  //   setSearchParams(newParams, { replace: true });
  // };

  return (
    <MarketplaceErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Search and Categories - full width for better mobile experience */}
        <FullWidthSection>
          <IntegratedSearchSection onRecentSearchClick={handleRecentSearchClick} />
        </FullWidthSection>

        {/* Enhanced: Events-Aware Header - Show upcoming events for gift opportunities */}
        {user && (
          <FullWidthSection className="py-4">
            <div className="max-w-6xl mx-auto">
              <EventsAwareHeader 
                isVisible={true}
                searchQuery={searchTerm}
              />
            </div>
          </FullWidthSection>
        )}

        {/* Enhanced: Connection Integration - Show when user is authenticated and no active search */}
        {user && !hasActiveSearch && (
          <FullWidthSection className="py-4">
            <div className="max-w-4xl mx-auto">
              <ConnectionIntegration 
                onSelectConnection={handleConnectionSelect}
                searchQuery={searchTerm}
              />
            </div>
          </FullWidthSection>
        )}

        {/* Countdown Banner */}
        <SubtleCountdownBanner />

        {/* Results Summary Bar */}
        <ResultsSummaryBar totalItems={products.length} searchTerm={searchTerm} />

        {/* Main Content - full bleed layout */}
        <FullWidthSection className={isMobile ? "pb-20" : "pb-12"} padding="none">
          <div ref={resultsRef}>
        {isLoading && products.length === 0 ? (
          <LoadingFallback type="marketplace" />
        ) : (
          <MarketplaceContent
            products={filteredProducts.length > 0 ? filteredProducts : products}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onProductView={handleProductView}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            error={error}
            onRefresh={handleRefresh}
          />
        )}
          </div>
        </FullWidthSection>

        {/* TEMPORARILY DISABLED: Nicole Marketplace Widget - Re-enable when technical issues are resolved */}
        {/* To re-enable, uncomment the following block and restore the associated state and handlers above:
        {(searchTerm && products.length > 0) && (
          <NicoleMarketplaceWidget 
            isOpen={isNicoleOpen}
            onClose={() => setIsNicoleOpen(false)}
            onSearchSuggestion={handleNicoleSearchSuggestion}
            searchQuery={searchTerm}
            totalResults={products.length}
            isFromNicole={isFromNicole}
          />
        )}
        */}
      </div>
    </MarketplaceErrorBoundary>
  );
};

export default MarketplaceWrapper;
