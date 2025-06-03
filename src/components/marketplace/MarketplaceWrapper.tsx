import React, { useState, useEffect, useRef } from "react";
import MarketplaceContent from "./MarketplaceContent";
import StickyFiltersBar from "./StickyFiltersBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import MarketplaceHero from "./MarketplaceHero";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";
import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { X } from "lucide-react";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { toast } from "sonner";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";

// Enhanced ResultsChip component for mobile
const ResultsChip = ({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) => (
  <FullWidthSection padding="minimal">
    <ResponsiveContainer>
      <div className="flex justify-center">
        <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-purple-700 font-semibold text-sm shadow-sm animate-fade-in border border-purple-200 relative">
          Showing results for <span className="font-bold mx-1">"{query}"</span>
          {onClear && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={onClear}
              className="ml-2 hover:bg-purple-200 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ lineHeight: 0 }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </span>
      </div>
    </ResponsiveContainer>
  </FullWidthSection>
);

const MarketplaceWrapper = () => {
  const isMobile = useIsMobile();
  // Default filters to closed, especially on mobile
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [products, setProducts] = useState(allProducts);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addSearch } = useUserSearchHistory();

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  // Used for auto-scroll
  const resultsRef = useRef<HTMLDivElement>(null);
  // We keep track if we just searched (to avoid repeat scrolls)
  const lastSearchRef = useRef<string | null>(null);

  // Close filters on mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowFilters(false);
    }
  }, [isMobile]);

  // Improved filtering logic: use dynamic mock product generation (for testing mode)
  useEffect(() => {
    let results = [];
    if (brandParam) {
      if (categoryParam) {
        results = searchMockProducts(`${brandParam} ${categoryParam}`, 12);
      } else if (searchTerm) {
        results = searchMockProducts(`${brandParam} ${searchTerm}`, 12);
      } else {
        results = searchMockProducts(brandParam, 12);
      }
    } else if (categoryParam) {
      if (searchTerm) {
        results = searchMockProducts(`${categoryParam} ${searchTerm}`, 16);
      } else {
        results = searchMockProducts(categoryParam, 16);
      }
    } else if (searchTerm) {
      results = searchMockProducts(searchTerm, 16);
    } else {
      results = searchMockProducts("Featured", 15);
    }
    setProducts(results);
    
    // Dismiss any category or brand loading toasts when products are loaded
    if (categoryParam) {
      toast.dismiss(`category-search-${categoryParam}`);
    }
    if (brandParam) {
      toast.dismiss(`brand-loading-${brandParam}`);
    }
  }, [searchTerm, categoryParam, brandParam]);
  
  // Track product view analytics
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
  };

  // Check if user is actively shopping (searching or browsing categories/brands)
  const isActivelyShopping = Boolean(searchTerm || categoryParam || brandParam);

  // Scroll to results section on search/category/brand change (UX improvement)
  useEffect(() => {
    if (isActivelyShopping && resultsRef.current) {
      if (
        lastSearchRef.current !== `${searchTerm}|${categoryParam}|${brandParam}`
      ) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        lastSearchRef.current = `${searchTerm}|${categoryParam}|${brandParam}`;
      }
    }
  }, [searchTerm, categoryParam, brandParam, isActivelyShopping]);

  // Handler to clear all filters and return to general marketplace
  const handleClearAll = () => {
    const newParams = new URLSearchParams();
    // Remove all filter params
    newParams.delete("search");
    newParams.delete("category");
    newParams.delete("brand");
    newParams.delete("pageTitle");
    setSearchParams(newParams, { replace: true });
  };

  // Add to user-specific search history when searchTerm changes
  // Only add manual searches, not system-generated ones
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      // Check if this might be a system-generated search by looking at URL patterns
      // or if it's coming from occasion/holiday navigation
      const isFromOccasion = location.state?.fromOccasion || false;
      
      // Only add to search history if it's not from an occasion/holiday click
      if (!isFromOccasion) {
        addSearch(searchTerm.trim(), false); // false = not system-generated
      }
    }
  }, [searchTerm, addSearch, location.state]);

  // Handler for clicking a recent search bubble - updates URL/search param
  const handleRecentSearchClick = (term: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    setSearchParams(newParams, { replace: true });
  };

  // Determine what to show in the results chip
  const getResultsDisplayText = () => {
    if (searchTerm) return searchTerm;
    if (categoryParam) return categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
    if (brandParam) return brandParam;
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Only show hero banner when NOT actively shopping */}
      {!isActivelyShopping && (
        <FullWidthSection background="gradient">
          <MarketplaceHero isCollapsed={false} />
        </FullWidthSection>
      )}

      {/* Full-width sticky filters bar */}
      <FullWidthSection background="white" className="border-b border-gray-200 sticky top-0 z-40">
        <ResponsiveContainer>
          <StickyFiltersBar
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            totalItems={products.length}
            searchTerm={searchTerm}
            onRecentSearchClick={handleRecentSearchClick}
          />
        </ResponsiveContainer>
      </FullWidthSection>

      {/* Results chip */}
      {isActivelyShopping && (
        <ResultsChip
          query={getResultsDisplayText()}
          onClear={handleClearAll}
        />
      )}

      {/* Main content with full-width capability for mobile */}
      <FullWidthSection className={isMobile ? "" : "container mx-auto"} padding={isMobile ? "none" : "standard"}>
        <div
          className={isMobile ? "pb-20" : "pb-12"}
          ref={resultsRef}
        >
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
