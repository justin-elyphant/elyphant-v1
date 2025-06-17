
import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface MarketplaceToolbarProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isMobile?: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const MarketplaceToolbar: React.FC<MarketplaceToolbarProps> = ({
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
  showFilters,
  setShowFilters,
  isMobile = false,
  currentPage,
  setCurrentPage,
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      {!isMobile && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Sort options */}
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-low-high">Price: Low to High</SelectItem>
            <SelectItem value="price-high-low">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>

        {/* View mode toggle */}
        <div className="flex border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-none border-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-none border-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceToolbar;
