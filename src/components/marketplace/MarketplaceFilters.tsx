
import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@/contexts/ProductContext";

interface MarketplaceFiltersProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  totalItems: number;
}

const MarketplaceFilters = ({
  showFilters,
  setShowFilters,
  viewMode,
  setViewMode,
  totalItems
}: MarketplaceFiltersProps) => {
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
            <Filter className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalItems} items
        </span>
        <Select defaultValue="relevance">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default MarketplaceFilters;
