
import React from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid3X3, List, BookmarkPlus, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketplaceFiltersProps {
  viewMode: "grid" | "list" | "modern";
  setViewMode: (mode: "grid" | "list" | "modern") => void;
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
    <div className="flex items-center justify-between mb-4 safe-area-inset">
      <div className="flex items-center gap-2 mobile-grid-optimized">
        {/* View mode toggle */}
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none px-2.5 touch-target-44 touch-manipulation tap-feedback no-select ${
              viewMode === "grid" ? "bg-muted" : ""
            }`}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none px-2.5 touch-target-44 touch-manipulation tap-feedback no-select ${
              viewMode === "list" ? "bg-muted" : ""
            }`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter toggle button - Mobile: Next to view toggle, Desktop: Separate */}
        {isMobile ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-8 touch-target-44 touch-manipulation tap-feedback no-select"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white touch-target-44 touch-manipulation tap-feedback no-select"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        )}

        {/* Saved filters toggle - Desktop only */}
        {!isMobile && savedFiltersCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={savedFiltersActive ? "default" : "outline"}
                  size="sm"
                  onClick={onSavedFiltersToggle}
                  className="relative touch-target-44 touch-manipulation tap-feedback no-select"
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
            <SelectTrigger className="h-8 w-[130px] sm:w-[160px] touch-target-44 touch-manipulation">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFilters;
