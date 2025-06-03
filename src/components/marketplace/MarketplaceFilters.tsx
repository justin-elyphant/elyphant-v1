
import React from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid3X3, List, BookmarkPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketplaceFiltersProps {
  viewMode: "grid" | "list" | "modern";
  setViewMode: (mode: "grid" | "list" | "modern") => void;
  totalItems: number;
  sortOption: string;
  onSortChange: (option: string) => void;
  isMobile: boolean;
  savedFiltersCount: number;
  onSavedFiltersToggle: () => void;
  savedFiltersActive: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
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
  savedFiltersActive,
  showFilters,
  setShowFilters,
}: MarketplaceFiltersProps) => {
  const handleSortChange = (value: string) => {
    onSortChange(value);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none px-2.5 ${
              viewMode === "grid" ? "bg-muted" : ""
            }`}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none px-2.5 ${
              viewMode === "list" ? "bg-muted" : ""
            }`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter toggle button - Desktop Only */}
        {!isMobile && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        )}

        {/* Saved filters toggle */}
        {savedFiltersCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={savedFiltersActive ? "default" : "outline"}
                  size="sm"
                  onClick={onSavedFiltersToggle}
                  className="relative"
                >
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  Saved Filters
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {savedFiltersCount}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Apply your saved filter preferences</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Sort by:
          </span>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 w-[130px] sm:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Item count */}
        {!isMobile && (
          <div className="text-sm text-muted-foreground ml-2">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceFilters;
