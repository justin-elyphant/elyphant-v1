import React, { useState, useEffect } from "react";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceContent from "./MarketplaceContent";
import StickyFiltersBar from "./StickyFiltersBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import MarketplaceHero from "./MarketplaceHero";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";

const MarketplaceWrapper = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [products, setProducts] = useState(allProducts);
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  // Live filter the mock products as the search term, category, or brand changes (NO API!)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader
        currentCategory={categoryParam}
        totalResults={products.length}
        filteredProducts={products}
      />

      {/* Hero banner with countdown - only show on main marketplace page */}
      {!categoryParam && !searchTerm && !brandParam && <MarketplaceHero />}

      <StickyFiltersBar
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        totalItems={products.length}
        searchTerm={searchTerm}
      />

      <main className={`container mx-auto px-4 ${isMobile ? "pb-20" : "pb-12"}`}>
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
