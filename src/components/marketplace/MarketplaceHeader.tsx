
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCategoryName } from "./hooks/utils/category/categoryNames";

interface MarketplaceHeaderProps {
  totalResults?: number;
  currentCategory?: string | null;
}

const MarketplaceHeader = ({
  totalResults,
  currentCategory
}: MarketplaceHeaderProps) => {
  const isMobile = useIsMobile();
  
  const categoryDisplayName = getCategoryName(currentCategory);

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between items-center mb-4`}>
        <h1 className="font-sans text-xl md:text-2xl font-semibold text-gray-900
          ${isMobile ? 'mb-4 text-center w-full' : ''}`}>
          {currentCategory ? `${categoryDisplayName}` : "Gift Marketplace"}
        </h1>
        {totalResults !== undefined && (
          <div className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'item' : 'items'} found
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceHeader;
