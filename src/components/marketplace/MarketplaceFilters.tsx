
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
        
        <div className="flex border rounded-md">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none min-h-9 px-2.5"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none min-h-9 px-2.5"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
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
