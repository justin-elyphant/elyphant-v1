
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageInfo } from "./hooks/usePageInfo";

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

  // UsePageInfo returns a getPageInfo method which returns { pageTitle, subtitle }
  const { getPageInfo } = usePageInfo(currentCategory ?? null, filteredProducts);

  // Call getPageInfo to get dynamic title/subtitle
  const { pageTitle, subtitle } = getPageInfo();

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between items-center mb-2`}>
        <h1
          className={`font-sans font-semibold text-gray-900
            ${isMobile ? 'mb-2 text-lg text-center w-full' : 'text-xl md:text-2xl'}`}
        >
          {pageTitle || "Gift Marketplace"}
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

