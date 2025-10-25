import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  LayoutGrid,
  SlidersHorizontal,
  X,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ViewMode = "pinterest" | "grid" | "list" | "all-items";
type SortOption = "recent" | "name" | "items" | "updated";

interface EnhancedWishlistHeaderProps {
  onCreateNew: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  availableCategories: string[];
  totalWishlists: number;
  className?: string;
}

const EnhancedWishlistHeader: React.FC<EnhancedWishlistHeaderProps> = ({
  onCreateNew,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  categoryFilter,
  onCategoryFilterChange,
  availableCategories,
  totalWishlists,
  className
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const viewModeOptions = [
    { mode: "pinterest" as const, icon: LayoutGrid, label: "Pinterest" },
    { mode: "grid" as const, icon: Grid3X3, label: "Grid" },
    { mode: "list" as const, icon: List, label: "List" }
  ];

  const sortOptions = [
    { value: "recent" as const, label: "Recently Added" },
    { value: "name" as const, label: "Name A-Z" },
    { value: "items" as const, label: "Most Items" },
    { value: "updated" as const, label: "Last Updated" }
  ];

  const clearAllFilters = () => {
    onSearchChange("");
    onCategoryFilterChange(null);
    setIsFilterOpen(false);
  };

  const activeFiltersCount = [
    searchQuery.length > 0,
    categoryFilter !== null
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Wishlists</h1>
          <p className="text-muted-foreground">
            {totalWishlists} {totalWishlists === 1 ? 'wishlist' : 'wishlists'}
          </p>
        </div>
        
        <Button onClick={onCreateNew} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Wishlist
        </Button>
      </div>

      {/* Marketplace-Style Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wishlists..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Right Side: Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle - Marketplace Style */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none px-2.5 h-8 ${
                viewMode === "pinterest" ? "bg-muted" : ""
              }`}
              onClick={() => onViewModeChange("pinterest")}
              title="Pinterest view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none px-2.5 h-8 ${
                viewMode === "grid" ? "bg-muted" : ""
              }`}
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none px-2.5 h-8 ${
                viewMode === "list" ? "bg-muted" : ""
              }`}
              onClick={() => onViewModeChange("list")}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none px-2.5 h-8 ${
                viewMode === "all-items" ? "bg-muted" : ""
              }`}
              onClick={() => onViewModeChange("all-items")}
              title="All items view"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Options Dropdown (Sort + Filter Combined) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Options
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              {sortOptions.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(sortBy === option.value && "bg-accent")}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Filters</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <Filter className="mr-2 h-4 w-4" />
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </DropdownMenuItem>
              
              {activeFiltersCount > 0 && (
                <DropdownMenuItem onClick={clearAllFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear All Filters
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsFilterOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={categoryFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryFilterChange(null)}
                >
                  All
                </Button>
                {availableCategories.map(category => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCategoryFilterChange(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && !isFilterOpen && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="smart-tag">
              Search: "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-xs hover:bg-transparent"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {categoryFilter && (
            <Badge variant="secondary" className="smart-tag">
              Category: {categoryFilter}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-xs hover:bg-transparent"
                onClick={() => onCategoryFilterChange(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedWishlistHeader;