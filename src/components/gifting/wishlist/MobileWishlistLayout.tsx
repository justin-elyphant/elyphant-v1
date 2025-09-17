import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Wishlist } from "@/types/profile";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "name" | "items" | "updated";

interface MobileWishlistLayoutProps {
  wishlists: Wishlist[];
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
  onCreateNew: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

const MobileWishlistLayout: React.FC<MobileWishlistLayoutProps> = ({
  wishlists,
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
  onCreateNew,
  onRefresh,
  isRefreshing = false,
  children
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const sortOptions = [
    { value: "recent" as const, label: "Recently Added" },
    { value: "name" as const, label: "Name A-Z" },
    { value: "items" as const, label: "Most Items" },
    { value: "updated" as const, label: "Last Updated" }
  ];

  const activeFiltersCount = [
    searchQuery.length > 0,
    categoryFilter !== null
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onSearchChange("");
    onCategoryFilterChange(null);
  };

  // iOS-style pull-to-refresh handler
  const handlePullToRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* iOS-style Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="safe-area-top" />
        
        {/* Main Header */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">My Wishlists</h1>
              <p className="text-sm text-muted-foreground">
                {totalWishlists} {totalWishlists === 1 ? 'wishlist' : 'wishlists'}
              </p>
            </div>
            
            {/* Create Button - iOS style */}
            <Button 
              onClick={onCreateNew}
              className="rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar - iOS style expandable */}
        <div className="px-4 pb-3">
          <div 
            className={cn(
              "relative transition-all duration-300",
              isSearchExpanded ? "w-full" : "w-full"
            )}
          >
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
            />
            <Input
              placeholder="Search wishlists..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => !searchQuery && setIsSearchExpanded(false)}
              className="pl-10 pr-12 h-10 rounded-xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
            
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                onClick={() => onSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-4 pb-3 flex items-center justify-between gap-3">
          {/* View Mode Toggle - iOS style segmented control */}
          <div className="flex bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-md text-sm font-medium transition-all",
                viewMode === "grid" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onViewModeChange("grid")}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-md text-sm font-medium transition-all",
                viewMode === "list" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>

          {/* Filter Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg">
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            
            {/* iOS-style Bottom Sheet */}
            <SheetContent side="bottom" className="rounded-t-2xl border-t">
              <SheetHeader className="text-left">
                <SheetTitle>Filter & Sort</SheetTitle>
              </SheetHeader>
              
              <div className="py-6 space-y-6">
                {/* Sort Options */}
                <div>
                  <h3 className="font-medium mb-3">Sort By</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {sortOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? "default" : "outline"}
                        className="justify-start h-11 rounded-xl"
                        onClick={() => onSortChange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={categoryFilter === null ? "default" : "outline"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => onCategoryFilterChange(null)}
                      >
                        All
                      </Button>
                      {availableCategories.map(category => (
                        <Button
                          key={category}
                          variant={categoryFilter === category ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
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
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full h-11 rounded-xl"
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="rounded-full">
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
                <Badge variant="secondary" className="rounded-full">
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
          </div>
        )}
      </div>

      {/* Main Content - with iOS-style pull-to-refresh */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Pull-to-refresh indicator area */}
        <div 
          className="relative"
          onTouchStart={(e) => {
            // Simple pull-to-refresh detection
            const touch = e.touches[0];
            if (touch && window.scrollY === 0) {
              // Store initial touch position for pull detection
              (e.currentTarget as any)._initialY = touch.clientY;
            }
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const initialY = (e.currentTarget as any)._initialY;
            if (touch && initialY && window.scrollY === 0) {
              const pullDistance = touch.clientY - initialY;
              if (pullDistance > 100) {
                handlePullToRefresh();
                (e.currentTarget as any)._initialY = null;
              }
            }
          }}
        >
          <div className="px-4 py-6">
            {children}
          </div>
        </div>
        
        {/* Safe area bottom padding */}
        <div className="safe-area-bottom" />
      </div>
    </div>
  );
};

export default MobileWishlistLayout;