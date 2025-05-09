import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSortOptions } from "./hooks/utils/categoryUtils";

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
  
  const handleSortChange = (value: string) => {
    onSortChange(value);
  };
  
  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        
        <div className="flex border rounded-md">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalItems} items
        </span>
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
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
