
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
  
  // Determine what to display based on current state
  const getDisplayInfo = () => {
    // Prioritize search over category if both exist
    if (searchParam) {
      return {
        pageTitle: `Search results for "${searchParam}"`,
        subtitle: `Found ${filteredProducts.length} items matching your search`
      };
    }
    
    if (categoryParam) {
      const categoryName = getCategoryName(categoryParam);
      return {
        pageTitle: categoryName,
        subtitle: `Browse our collection of ${categoryName.toLowerCase()}`
      };
    }
    
    // Default state
    return {
      pageTitle: "Gift Marketplace",
      subtitle: "Discover the perfect gifts for every occasion"
    };
  };

  const { pageTitle, subtitle } = getDisplayInfo();

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between items-center mb-2`}>
        <h1
          className={`font-sans font-semibold text-gray-900
            ${isMobile ? 'mb-2 text-lg text-center w-full' : 'text-xl md:text-2xl'}`}
        >
          {pageTitle}
        </h1>
        {totalResults !== undefined && (
          <div className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'item' : 'items'} found
          </div>
        )}
      </div>
      {subtitle && (
        <p className={`text-sm text-muted-foreground ${isMobile ? "text-center" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default MarketplaceHeader;
