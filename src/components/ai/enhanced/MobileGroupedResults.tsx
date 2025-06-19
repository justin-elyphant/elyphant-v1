
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import GroupedSearchResultsComponent from "../GroupedSearchResults";
import type { GroupedSearchResults } from "@/services/ai/multiCategorySearchService";
import { Product } from "@/contexts/ProductContext";

interface MobileGroupedResultsProps {
  groupedResults: GroupedSearchResults;
  onProductSelect?: (product: Product) => void;
  onCategoryExpand?: (categoryName: string) => void;
}

const MobileGroupedResults: React.FC<MobileGroupedResultsProps> = ({
  groupedResults,
  onProductSelect,
  onCategoryExpand
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`w-full ${isMobile ? 'px-2' : 'px-4'}`}>
      {/* Mobile-specific header adjustments */}
      {isMobile && groupedResults.categories.length > 0 && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            Smart Results
          </div>
        </div>
      )}

      <GroupedSearchResultsComponent
        groupedResults={groupedResults}
        onProductSelect={onProductSelect}
        onCategoryExpand={onCategoryExpand}
      />

      {/* Mobile-specific footer for better UX */}
      {isMobile && groupedResults.categories.length > 0 && (
        <div className="mt-6 text-center text-xs text-gray-500 pb-4">
          Swipe horizontally to see more products in each category
        </div>
      )}
    </div>
  );
};

export default MobileGroupedResults;
