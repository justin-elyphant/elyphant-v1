
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { getCategoryName } from "./hooks/utils/category/categoryNames";

interface MarketplaceHeaderProps {
  totalResults?: number;
  currentCategory?: string | null;
  filteredProducts?: any[];
}

const MarketplaceHeader = ({
  totalResults,
  currentCategory,
  filteredProducts = [],
}: MarketplaceHeaderProps) => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  
  // Get current state from URL params
  const searchParam = searchParams.get("search");
  const categoryParam = searchParams.get("category") || currentCategory;
  
  // Only show header content when there's no active search or category
  // since we have the "Showing results for: x" section that handles this
  const shouldShowHeader = !searchParam && !categoryParam;
  
  if (!shouldShowHeader) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between items-center mb-2`}>
        <h1
          className={`font-sans font-semibold text-gray-900
            ${isMobile ? 'mb-2 text-lg text-center w-full' : 'text-xl md:text-2xl'}`}
        >
          Gift Marketplace
        </h1>
        {totalResults !== undefined && (
          <div className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'item' : 'items'} found
          </div>
        )}
      </div>
      <p className={`text-sm text-muted-foreground ${isMobile ? "text-center" : ""}`}>
        Discover the perfect gifts for every occasion
      </p>
    </div>
  );
};

export default MarketplaceHeader;
