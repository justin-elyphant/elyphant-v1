
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketplaceHeaderProps {
  totalResults?: number;
}

const MarketplaceHeader = ({
  totalResults
}: MarketplaceHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between items-center mb-4`}>
        <h1 className={`text-2xl font-semibold text-gray-900 ${isMobile ? 'mb-4 text-center w-full' : ''}`}>
          Gift Marketplace
        </h1>
        {totalResults !== undefined && (
          <div className="text-sm text-gray-500">
            {totalResults} {totalResults === 1 ? 'item' : 'items'} found
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceHeader;
