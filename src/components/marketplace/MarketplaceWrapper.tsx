
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

// New: ResultsChip component
const ResultsChip = ({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) => (
  <div className="flex justify-center mt-1 mb-5">
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
);

const MarketplaceWrapper = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [products, setProducts] = useState(allProducts);
  const isMobile = useIsMobile();
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

  // Collapse hero if user is searching or has selected a category or brand
  const shouldCollapseHero = Boolean(searchTerm || categoryParam || brandParam);

  // Scroll to results section on search/category/brand change (UX improvement)
  useEffect(() => {
    if (shouldCollapseHero && resultsRef.current) {
      if (
        lastSearchRef.current !== `${searchTerm}|${categoryParam}|${brandParam}`
      ) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        lastSearchRef.current = `${searchTerm}|${categoryParam}|${brandParam}`;
      }
    }
  }, [searchTerm, categoryParam, brandParam, shouldCollapseHero]);

  // Handler to clear search and stay on same page (removes "search" query param)
  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams, { replace: true });
  };

  // Add to user-specific search history when searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      addSearch(searchTerm.trim());
    }
  }, [searchTerm, addSearch]);

  // Handler for clicking a recent search bubble - updates URL/search param
  const handleRecentSearchClick = (term: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner with countdown - only show on main marketplace page */}
      <MarketplaceHero isCollapsed={shouldCollapseHero} />

      <StickyFiltersBar
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        totalItems={products.length}
        searchTerm={searchTerm}
        onRecentSearchClick={handleRecentSearchClick}
      />

      {/* Show a 'results for' chip if searching or category/brand filter is on */}
      {(searchTerm || categoryParam || brandParam) && (
        <ResultsChip
          query={searchTerm || categoryParam || brandParam || ""}
          onClear={searchTerm ? handleClearSearch : undefined}
        />
      )}

      <main
        className={`container mx-auto px-4 ${isMobile ? "pb-20" : "pb-12"}`}
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
      </main>
    </div>
  );
};

export default MarketplaceWrapper;
