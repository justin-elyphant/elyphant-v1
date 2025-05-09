
import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal, LayoutGrid, List, LayoutTemplate, Bookmark, BookmarkCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSortOptions } from "./hooks/utils/categoryUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketplaceFiltersProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  viewMode: "grid" | "list" | "modern";
  setViewMode: (mode: "grid" | "list" | "modern") => void;
  totalItems: number;
  sortOption: string;
  onSortChange: (option: string) => void;
  isMobile?: boolean;
  savedFiltersCount?: number;
  onSavedFiltersToggle?: () => void;
  savedFiltersActive?: boolean;
}

const MarketplaceFilters = ({
  showFilters,
  setShowFilters,
  viewMode,
  setViewMode,
  totalItems,
  sortOption,
  onSortChange,
  isMobile: propIsMobile,
  savedFiltersCount = 0,
  onSavedFiltersToggle,
  savedFiltersActive = false,
}: MarketplaceFiltersProps) => {
  const sortOptions = getSortOptions();
  const hookIsMobile = useIsMobile();
  // Use the prop if provided, otherwise use the hook
  const isMobile = propIsMobile !== undefined ? propIsMobile : hookIsMobile;
  
  const handleSortChange = (value: string) => {
    onSortChange(value);
  };
  
  return (
    <div className={`flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2 md:gap-3 ${isMobile ? 'pb-2 border-b' : ''}`}>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={() => setShowFilters(!showFilters)}
          className="min-h-9 px-2.5 md:px-3"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1 md:mr-2" />
          <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
        </Button>
        
        {/* Saved filters toggle */}
        {savedFiltersCount > 0 && onSavedFiltersToggle && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={savedFiltersActive ? "default" : "outline"}
                  size={isMobile ? "sm" : "default"}
                  onClick={onSavedFiltersToggle}
                  className="min-h-9"
                >
                  {savedFiltersActive ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle saved filters ({savedFiltersCount})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Enhanced view mode toggle with modern view option */}
        {!isMobile && (
          <div className="flex border rounded-md">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none min-h-9 px-2.5"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid view</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none rounded-r-none min-h-9 px-2.5"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List view</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'modern' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('modern')}
                    className="rounded-l-none min-h-9 px-2.5"
                  >
                    <LayoutTemplate className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modern view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
          {totalItems} items
        </span>
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[130px] md:w-[180px] h-9 text-xs md:text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default MarketplaceFilters;
