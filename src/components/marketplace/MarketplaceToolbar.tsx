
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid3X3, List, BookmarkPlus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketplaceToolbarProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  totalItems: number;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isMobile: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const MarketplaceToolbar = ({
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
  totalItems,
  showFilters,
  setShowFilters,
  isMobile,
  currentPage,
  setCurrentPage,
}: MarketplaceToolbarProps) => {
  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 safe-area-inset mobile-grid-optimized">
      <div className="flex items-center gap-2 w-full sm:w-auto">
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

        {/* Filter toggle button */}
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

        {/* Results count */}
        <div className="text-sm text-muted-foreground whitespace-nowrap leading-relaxed">
          {totalItems > 0 ? (
            <>
              Showing {startItem}-{endItem} of {totalItems} results
            </>
          ) : (
            "No results found"
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="touch-target-44 touch-manipulation tap-feedback no-select"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2 leading-relaxed">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="touch-target-44 touch-manipulation tap-feedback no-select"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline leading-relaxed">
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

export default MarketplaceToolbar;
