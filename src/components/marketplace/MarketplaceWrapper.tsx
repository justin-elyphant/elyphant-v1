
import React, { useState, useEffect, useRef } from "react";
import MarketplaceContent from "./MarketplaceContent";
import IntegratedSearchSection from "./IntegratedSearchSection";
import SubtleCountdownBanner from "./SubtleCountdownBanner";
import ResultsSummaryBar from "./ResultsSummaryBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import MarketplaceHero from "./MarketplaceHero";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";
import { searchMockProducts } from "@/components/marketplace/services/mockProductService";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { toast } from "sonner";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { X } from "lucide-react";

const MarketplaceWrapper = () => {
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [products, setProducts] = useState(allProducts);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addSearch } = useUserSearchHistory();

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  const resultsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string | null>(null);

  // Close filters on mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowFilters(false);
    }
  }, [isMobile]);

  // Product filtering and search logic
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
    
    // Dismiss loading toasts
    if (categoryParam) {
      toast.dismiss(`category-search-${categoryParam}`);
    }
    if (brandParam) {
      toast.dismiss(`brand-loading-${brandParam}`);
    }
  }, [searchTerm, categoryParam, brandParam]);
  
  const handleProductView = (productId: string) => {
    console.log(`Product viewed: ${productId}`);
  };

  const isActivelyShopping = Boolean(searchTerm || categoryParam || brandParam);

  // Auto-scroll to results on search/filter changes
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
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section - only when not actively shopping */}
      {!isActivelyShopping && (
        <FullWidthSection background="gradient">
          <MarketplaceHero isCollapsed={false} />
        </FullWidthSection>
      )}

      {/* Search and Categories - full width for better mobile experience */}
      <FullWidthSection>
        <IntegratedSearchSection onRecentSearchClick={handleRecentSearchClick} />
      </FullWidthSection>

      {/* Countdown Banner */}
      <SubtleCountdownBanner />

      {/* Results Summary Bar - replaces the old condensed filters bar */}
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
