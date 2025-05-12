
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid2X2, Rows, BookmarkCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarketplaceFiltersProps {
  viewMode: "grid" | "list" | "modern";
  setViewMode: (mode: "grid" | "list" | "modern") => void;
  totalItems?: number;
  sortOption: string;
  onSortChange: (option: string) => void;
  isMobile: boolean;
  savedFiltersCount: number;
  onSavedFiltersToggle: () => void;
  savedFiltersActive: boolean;
}

const MarketplaceFilters = ({
  viewMode,
  setViewMode,
  totalItems,
  sortOption,
  onSortChange,
  isMobile,
  savedFiltersCount,
  onSavedFiltersToggle,
  savedFiltersActive
}: MarketplaceFiltersProps) => {
  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "priceAsc", label: "Price: Low to High" },
    { value: "priceDesc", label: "Price: High to Low" },
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Top Rated" }
  ];
  
  // Get label for current sort option
  const getSortLabel = (value: string) => {
    const option = sortOptions.find(opt => opt.value === value);
    return option ? option.label : "Relevance";
  };
  
  return (
    <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-3 rounded-md shadow-sm border">
      <div className="flex gap-2 items-center">
        {/* View mode buttons */}
        <div className="hidden sm:flex border rounded-md">
          <Button
            onClick={() => setViewMode("grid")}
            variant="ghost"
            size="sm"
            className={`rounded-r-none ${viewMode === "grid" ? "bg-gray-100" : ""}`}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setViewMode("list")}
            variant="ghost"
            size="sm"
            className={`rounded-l-none ${viewMode === "list" ? "bg-gray-100" : ""}`}
          >
            <Rows className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Sort options */}
        <div>
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] text-sm h-9">
              <SelectValue>
                {getSortLabel(sortOption)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Saved filters button - only shown if user has saved filters */}
        {savedFiltersCount > 0 && (
          <Button
            variant={savedFiltersActive ? "default" : "outline"}
            size="sm"
            onClick={onSavedFiltersToggle}
            className="hidden sm:flex items-center"
          >
            <BookmarkCheck className="h-4 w-4 mr-2" />
            Saved Filters
            <Badge className="ml-2" variant="secondary">
              {savedFiltersCount}
            </Badge>
          </Button>
        )}
      </div>
      
      {/* Right side items (only shown on larger screens) */}
      <div className="hidden md:block text-sm text-muted-foreground">
        {totalItems !== undefined && (
          <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
        )}
      </div>
    </div>
  );
};

export default MarketplaceFilters;
