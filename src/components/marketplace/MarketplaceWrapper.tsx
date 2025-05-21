import React, { useState, useEffect, useRef } from "react";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceContent from "./MarketplaceContent";
import StickyFiltersBar from "./StickyFiltersBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import MarketplaceHero from "./MarketplaceHero";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";

// New: ResultsChip component
const ResultsChip = ({ query }: { query: string }) => (
  <div className="flex justify-center mt-1 mb-5">
    <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-purple-700 font-semibold text-sm shadow-sm animate-fade-in border border-purple-200">
      Showing results for <span className="font-bold mx-1">"{query}"</span>
    </span>
  </div>
);

const MarketplaceWrapper = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [products, setProducts] = useState(allProducts);
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  // Used for auto-scroll
  const resultsRef = useRef<HTMLDivElement>(null);
  // We keep track if we just searched (to avoid repeat scrolls)
  const lastSearchRef = useRef<string | null>(null);

  // Filtering logic (live filter mock products)
  useEffect(() => {
    let filtered = allProducts;

    if (brandParam) {
      filtered = filtered.filter(
        (p) =>
          p.brand && p.brand.toLowerCase() === brandParam.toLowerCase()
      );
    } else if (categoryParam) {
      filtered = filtered.filter(
        (p) => (p.category || "").toLowerCase() === categoryParam.toLowerCase()
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    setProducts(filtered);
  }, [searchTerm, categoryParam, brandParam]);

  // Track product view analytics
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
    // ... could hook up analytics events here
  };

  // Collapse hero if user is searching or has selected a category or brand
  const shouldCollapseHero = Boolean(searchTerm || categoryParam || brandParam);

  // Scroll to results section on search/category/brand change (UX improvement)
  useEffect(() => {
    if (shouldCollapseHero && resultsRef.current) {
      // Only auto-scroll if user just searched (avoid on first render or param clears)
      if (
        lastSearchRef.current !== `${searchTerm}|${categoryParam}|${brandParam}`
      ) {
        setTimeout(() => {
          // Smooth scroll so results are clear, both mobile/desktop
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150); // Timeout allows hero to collapse first
        lastSearchRef.current = `${searchTerm}|${categoryParam}|${brandParam}`;
      }
    }
  }, [searchTerm, categoryParam, brandParam, shouldCollapseHero]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader
        currentCategory={categoryParam}
        totalResults={products.length}
        filteredProducts={products}
      />

      {/* Hero banner with countdown - only show on main marketplace page */}
      <MarketplaceHero isCollapsed={shouldCollapseHero} />

      <StickyFiltersBar
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        totalItems={products.length}
        searchTerm={searchTerm}
      />

      {/* Show a 'results for' chip if searching or category/brand filter is on */}
      {(searchTerm || categoryParam || brandParam) && (
        <ResultsChip query={searchTerm || categoryParam || brandParam || ""} />
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
