
import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSortOptions } from "./hooks/utils/categoryUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketplaceFiltersProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  viewMode: "grid" | "list" | "modern";
  setViewMode: (mode: "grid" | "list" | "modern") => void;
  totalItems: number;
  sortOption: string;
  onSortChange: (option: string) => void;
}

const MarketplaceFilters = ({
  showFilters,
  setShowFilters,
  viewMode,
  setViewMode,
  totalItems,
  sortOption,
  onSortChange
}: MarketplaceFiltersProps) => {
  const sortOptions = getSortOptions();
  const isMobile = useIsMobile();
  
  const handleSortChange = (value: string) => {
    onSortChange(value);
  };
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={() => setShowFilters(!showFilters)}
          className="flex-grow sm:flex-grow-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Filters'}
        </Button>
        
        <div className="flex border rounded-md ml-auto sm:ml-0">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none px-2 sm:px-3"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none px-2 sm:px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalItems} items
        </span>
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
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
    </div>
  );
};

export default MarketplaceFilters;
