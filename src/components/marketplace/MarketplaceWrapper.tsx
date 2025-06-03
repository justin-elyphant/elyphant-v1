
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import IntegratedSearchSection from "./IntegratedSearchSection";
import SubtleCountdownBanner from "./SubtleCountdownBanner";
import ResultsSummaryBar from "./ResultsSummaryBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";
import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { toast } from "sonner";
import { FullWidthSection } from "@/components/layout/FullWidthSection";

const MarketplaceWrapper = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addSearch } = useUserSearchHistory();

  // Check if this is a fresh navigation from home page
  const isFromHomePage = location.state?.fromHome || false;

  // Initialize showFilters state - always false if coming from home
  const [showFilters, setShowFilters] = useState(() => {
    if (isFromHomePage) return false;
    return !isMobile;
  });
  
  const [products, setProducts] = useState(allProducts);

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  const resultsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string | null>(null);

  // Redirect to home if no search or category is present (no discovery mode)
  useEffect(() => {
    if (!searchTerm && !categoryParam && !brandParam) {
      console.log('No search/category/brand params found, redirecting to home');
      navigate('/', { replace: true });
      return;
    }
  }, [searchTerm, categoryParam, brandParam, navigate]);

  // Clear the fromHome state after initial load to allow normal behavior
  useEffect(() => {
    if (isFromHomePage) {
      // Replace the current history entry to remove the fromHome state
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }, [isFromHomePage]);

  // Close filters on mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowFilters(false);
    }
  }, [isMobile]);

  // Clean up conflicting URL parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let shouldUpdate = false;

    // If both search and category exist, prioritize search and clear category
    if (searchTerm && categoryParam) {
      console.log('Detected conflicting search and category params, prioritizing search');
      params.delete("category");
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setSearchParams(params, { replace: true });
    }
  }, [searchTerm, categoryParam, setSearchParams]);

  // Product filtering and search logic
  useEffect(() => {
    let results = [];
    
    // Prioritize search over category
    if (searchTerm) {
      if (brandParam) {
        results = searchMockProducts(`${brandParam} ${searchTerm}`, 12);
      } else {
        results = searchMockProducts(searchTerm, 16);
      }
    } else if (brandParam) {
      if (categoryParam) {
        results = searchMockProducts(`${brandParam} ${categoryParam}`, 12);
      } else {
        results = searchMockProducts(brandParam, 12);
      }
    } else if (categoryParam) {
      results = searchMockProducts(categoryParam, 16);
    }
    
    setProducts(results);
    
    // Dismiss loading toasts
    if (categoryParam && !searchTerm) {
      toast.dismiss(`category-search-${categoryParam}`);
    }
    if (brandParam) {
      toast.dismiss(`brand-loading-${brandParam}`);
    }
  }, [searchTerm, categoryParam, brandParam]);
  
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
  };

  const hasActiveSearch = Boolean(searchTerm || categoryParam || brandParam);

  // Auto-scroll to results on search/filter changes
  useEffect(() => {
    if (hasActiveSearch && resultsRef.current) {
      const currentSearchKey = `${searchTerm}|${categoryParam}|${brandParam}`;
      if (lastSearchRef.current !== currentSearchKey) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        lastSearchRef.current = currentSearchKey;
      }
    }
  }, [searchTerm, categoryParam, brandParam, hasActiveSearch]);

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
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    // Clear category when doing a search
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
  };

  // Don't render if no search/category (will redirect)
  if (!searchTerm && !categoryParam && !brandParam) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search and Categories - full width for better mobile experience */}
      <FullWidthSection>
        <IntegratedSearchSection onRecentSearchClick={handleRecentSearchClick} />
      </FullWidthSection>

      {/* Countdown Banner */}
      <SubtleCountdownBanner />

      {/* Results Summary Bar */}
      <ResultsSummaryBar totalItems={products.length} />

      {/* Main Content - full bleed layout */}
      <FullWidthSection className={isMobile ? "pb-20" : "pb-12"} padding="none">
        <div ref={resultsRef}>
          <MarketplaceContent
            products={products}
            isLoading={false}
            searchTerm={searchTerm}
            onProductView={handleProductView}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        </div>
      </FullWidthSection>
    </div>
  );
};

export default MarketplaceWrapper;
