
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";

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
  const urlSearchTerm = searchParams.get("search") || searchTerm;

  // Get the actual product count - prioritize totalItems prop, then products length
  const actualProductCount = totalItems !== undefined ? totalItems : (products?.length || 0);
  
  // Filter products to match current search/category if no totalItems provided
  const filteredCount = totalItems !== undefined ? totalItems : 
    products?.filter(product => {
      if (urlSearchTerm) {
        const searchLower = urlSearchTerm.toLowerCase();
        const matchesSearch = (
          product.title?.toLowerCase().includes(searchLower) ||
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }
      
      if (categoryParam) {
        const categoryLower = categoryParam.toLowerCase();
        const productCategory = (product.category || '').toLowerCase();
        if (!productCategory.includes(categoryLower)) return false;
      }
      
      if (brandParam) {
        const brandLower = brandParam.toLowerCase();
        const productBrand = (product.brand || product.vendor || '').toLowerCase();
        if (!productBrand.includes(brandLower)) return false;
      }
      
      return true;
    })?.length || 0;

  const displayCount = filteredCount;

  const hasActiveFilters = Boolean(urlSearchTerm || categoryParam || brandParam);

  const handleClearAll = () => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams, { replace: true });
  };

  const getActiveFiltersText = () => {
    const filters = [];
    if (urlSearchTerm) filters.push(`"${urlSearchTerm}"`);
    if (categoryParam) filters.push(categoryParam);
    if (brandParam) filters.push(brandParam);
    return filters.join(", ");
  };

  const getDisplayText = () => {
    if (isMobile) {
      // On mobile, show the search term or "Filtered" if other filters are active
      if (urlSearchTerm) {
        return urlSearchTerm;
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

  // Only render if we have active filters or search terms
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="w-full px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
          </div>
          
          <div className="text-sm text-gray-600 flex-shrink-0">
            {displayCount.toLocaleString()} {displayCount === 1 ? "item" : "items"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummaryBar;
