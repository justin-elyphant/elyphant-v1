import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterPillsProps {
  filters: any;
  onRemoveFilter: (filterType: string, value?: any) => void;
  onClearAll: () => void;
}

const FilterPills = ({ filters, onRemoveFilter, onClearAll }: FilterPillsProps) => {
  const getActiveFilters = () => {
    const activeFilters = [];

    // Price range
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 500)) {
      activeFilters.push({
        type: 'priceRange',
        label: `$${filters.priceRange[0]} - ${filters.priceRange[1] === 500 ? '$500+' : `$${filters.priceRange[1]}`}`,
        value: filters.priceRange
      });
    }

    // Categories
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category: string) => {
        activeFilters.push({
          type: 'category',
          label: category,
          value: category
        });
      });
    }

    // Rating
    if (filters.rating) {
      activeFilters.push({
        type: 'rating',
        label: `${filters.rating}★ & Up`,
        value: filters.rating
      });
    }

    // Free shipping
    if (filters.freeShipping) {
      activeFilters.push({
        type: 'freeShipping',
        label: 'Free Shipping',
        value: true
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${index}`}
          variant="secondary"
          className="flex items-center gap-1 px-3 py-1"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => {
              if (filter.type === 'category') {
                onRemoveFilter('category', filter.value);
              } else {
                onRemoveFilter(filter.type);
              }
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
};

export default FilterPills;