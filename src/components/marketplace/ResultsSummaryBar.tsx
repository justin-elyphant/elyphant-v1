
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";

interface ResultsSummaryBarProps {
  totalItems?: number;
}

const ResultsSummaryBar: React.FC<ResultsSummaryBarProps> = ({
  totalItems = 0,
}) => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchTerm = searchParams.get("search");
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

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

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="w-full px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 truncate">
                  {isMobile ? "Filtered" : `Showing results for: ${getActiveFiltersText()}`}
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
            {totalItems.toLocaleString()} {totalItems === 1 ? "item" : "items"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummaryBar;
