
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import SecondaryHeaderManager from "@/components/navigation/SecondaryHeaderManager";

interface ResultsSummaryBarProps {
  totalItems?: number;
  searchTerm?: string;
}

const ResultsSummaryBar: React.FC<ResultsSummaryBarProps> = ({
  totalItems,
  searchTerm = "",
}) => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useProducts();
  
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  // Use provided totalItems or fallback to products length
  const displayCount = totalItems !== undefined ? totalItems : (products?.length || 0);

  const hasActiveFilters = Boolean(searchTerm || categoryParam || brandParam);

  const handleClearAll = () => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams, { replace: true });
  };

  const getActiveFiltersText = () => {
    const filters = [];
    if (searchTerm) filters.push(`"${searchTerm}"`);
    if (categoryParam) filters.push(categoryParam);
    if (brandParam) filters.push(brandParam);
    return filters.join(", ");
  };

  const getDisplayText = () => {
    if (isMobile) {
      // On mobile, show the search term or "Filtered" if other filters are active
      if (searchTerm) {
        return searchTerm;
      } else if (categoryParam || brandParam) {
        return "Filtered results";
      }
      return "";
    } else {
      // On desktop, show full "Showing results for:" text
      if (hasActiveFilters) {
        return `Showing results for: ${getActiveFiltersText()}`;
      }
      return "";
    }
  };

  return (
    <SecondaryHeaderManager 
      priority={1} 
      className="bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="w-full px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 truncate">
                  {getDisplayText()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 flex-shrink-0">
            {displayCount.toLocaleString()} {displayCount === 1 ? "item" : "items"}
          </div>
        </div>
      </div>
    </SecondaryHeaderManager>
  );
};

export default ResultsSummaryBar;
