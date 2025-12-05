
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import IntegratedSearchSection from "./IntegratedSearchSection";
import SubtleCountdownBanner from "./SubtleCountdownBanner";
import ResultsSummaryBar from "./ResultsSummaryBar";
import MarketplaceErrorBoundary from "./error/ErrorBoundary";
import ConnectionIntegration from "./integration/ConnectionIntegration";
import EventsAwareHeader from "./integration/EventsAwareHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useAuth } from "@/contexts/auth";
import { useMarketplace } from "@/hooks/useMarketplace";
import { toast } from "sonner";
import { FullWidthSection } from "@/components/layout/FullWidthSection";

const MarketplaceWrapper = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addSearch } = useUserSearchHistory();
  const { user } = useAuth();

  // Use the unified marketplace hook
  const { products, isLoading, error, refetch } = useMarketplace();

  // Check if this is a fresh navigation from home page or Nicole
  const isFromHomePage = location.state?.fromHome || false;
  const isFromNicole = location.state?.fromNicole || false;

  // Initialize showFilters state - always default to false
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const brandCategoriesParam = searchParams.get("brandCategories");

  const resultsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string | null>(null);

  // Clear the fromHome state after initial load to allow normal behavior
  useEffect(() => {
    if (isFromHomePage || isFromNicole) {
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
    const hasActiveSearch = Boolean(searchTerm || categoryParam || brandParam || brandCategoriesParam);
    if (!hasActiveSearch) {
      setShowFilters(false);
    }
  }, [searchTerm, categoryParam, brandParam, brandCategoriesParam, isMobile, isInitialLoad]);

  // Clean up conflicting URL parameters and dismiss lingering toasts
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let shouldUpdate = false;

    if (searchTerm && categoryParam) {
      console.log('Detected conflicting search and category params, prioritizing search');
      params.delete("category");
      shouldUpdate = true;
    }

    // Enhanced toast cleanup
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
    if (categoryParam && !searchTerm) {
      toast.dismiss(`category-search-${categoryParam}`);
    }
    if (brandParam) {
      toast.dismiss(`brand-loading-${brandParam}`);
    }
    if (searchTerm) {
      toast.dismiss("search-loading");
      toast.dismiss("search-error");
    }
  }, [searchTerm, categoryParam, brandParam]);
  
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
  };

  const hasActiveSearch = Boolean(searchTerm || categoryParam || brandParam);

  // Auto-scroll to results on search/filter changes
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

  // Add to search history
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const isFromOccasion = location.state?.fromOccasion || false;
      if (!isFromOccasion) {
        addSearch(searchTerm.trim(), false);
      }
    }
  }, [searchTerm, addSearch, location.state]);

  const handleRecentSearchClick = (term: string) => {
    toast.dismiss();
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // Handle connection selection for gifting context
  const handleConnectionSelect = (connectionId: string, name: string) => {
    console.log('Selected connection for gifting:', { connectionId, name });
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", `gifts for ${name}`);
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
    toast.success(`Finding gifts for ${name}`, {
      description: "Searching for personalized recommendations"
    });
  };

  return (
    <MarketplaceErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Search and Categories */}
        <FullWidthSection>
          <IntegratedSearchSection onRecentSearchClick={handleRecentSearchClick} />
        </FullWidthSection>

        {/* Events-Aware Header */}
        {user && (
          <FullWidthSection className="py-2">
            <div className="max-w-6xl mx-auto">
              <EventsAwareHeader 
                isVisible={true}
                searchQuery={searchTerm}
              />
            </div>
          </FullWidthSection>
        )}

        {/* Connection Integration */}
        {user && !hasActiveSearch && (
          <FullWidthSection className="py-2">
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

        {/* Main Content */}
        <FullWidthSection className={isMobile ? "pb-20 lg:pb-12" : "pb-12"} padding="none">
          <div ref={resultsRef}>
            <MarketplaceContent
              searchTerm={searchTerm}
              onProductView={handleProductView}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onRefresh={handleRefresh}
              products={products}
              isLoading={isLoading}
              error={error || null}
            />
          </div>
        </FullWidthSection>
      </div>
    </MarketplaceErrorBoundary>
  );
};

export default MarketplaceWrapper;
