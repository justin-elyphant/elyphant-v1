
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

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
  setCurrentPage: (pageNumber: number) => void;
}

const MarketplaceToolbar: React.FC<MarketplaceToolbarProps> = ({
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
  totalItems,
  showFilters,
  setShowFilters,
  isMobile,
  currentPage,
  setCurrentPage
}) => {
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Customer Rating" },
    { value: "newest", label: "Newest" }
  ];

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {totalItems} {totalItems === 1 ? 'result' : 'results'}
      </div>

      <div className="flex items-center gap-3">
        {/* Pagination controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="px-4 py-2"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1} // Optional: Disable if on the first page
          >
            Previous
          </Button>

          {/* Page numbers */}
          {!isMobile && (
            <>
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 py-2"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  {currentPage - 1}
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                className="px-4 py-2"
                onClick={() => setCurrentPage(currentPage)}
              >
                {currentPage}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {currentPage + 1}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="px-4 py-2"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>

        {/* Sort dropdown */}
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View mode toggle */}
        {!isMobile && (
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-r-none border-r",
                viewMode === "grid" && "bg-primary text-primary-foreground"
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-l-none",
                viewMode === "list" && "bg-primary text-primary-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Filters toggle for desktop */}
        {!isMobile && (
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default MarketplaceToolbar;
