/**
 * Lululemon-Style Mobile Filters
 * Clean, minimal horizontal filter bar with dropdowns
 * iOS Capacitor compliant with 44px touch targets
 */

import React, { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSmartFilters, type QuickFilter } from "@/hooks/useSmartFilters";
import { Badge } from "@/components/ui/badge";

interface LululemonMobileFiltersProps {
  searchTerm: string;
  products: any[];
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onOpenFullFilters: () => void;
  // Phase 4: Server-side facets
  serverFacets?: {
    brands?: Array<{ name: string; count: number }>;
    priceRanges?: Array<{ label: string; min: number; max: number; count: number }>;
    categories?: Array<{ name: string; count: number }>;
  };
}

const LululemonMobileFilters: React.FC<LululemonMobileFiltersProps> = ({
  searchTerm,
  products,
  activeFilters,
  onFilterChange,
  onOpenFullFilters,
  serverFacets
}) => {
  const { quickFilters, detectedCategory } = useSmartFilters(searchTerm, products);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  
  // Enhance brand filter with server facets if available
  const enhancedQuickFilters = quickFilters.map(filter => {
    if (filter.key === 'brand' && serverFacets?.brands && serverFacets.brands.length > 0) {
      return {
        ...filter,
        options: serverFacets.brands.map(b => ({ value: b.name, label: `${b.name} (${b.count})` }))
      };
    }
    return filter;
  });

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key === 'sortBy' && value !== 'relevance') count++;
      else if (key === 'priceRange' && value) count++;
      else if (Array.isArray(value) && value.length > 0) count++;
      else if (value && key !== 'sortBy') count++;
    });
    return count;
  };

  const getDisplayValue = (filter: QuickFilter) => {
    const value = activeFilters[filter.key];
    
    if (filter.key === 'sortBy') {
      const option = filter.options?.find(o => o.value === value);
      return option?.label || 'Featured';
    }
    
    if (filter.key === 'priceRange' && value) {
      return value;
    }
    
    if (Array.isArray(value) && value.length > 0) {
      return value.length === 1 ? value[0] : `${value.length} selected`;
    }
    
    return filter.label;
  };

  const handleOptionSelect = (filterKey: string, optionValue: string) => {
    const currentValue = activeFilters[filterKey];
    
    if (filterKey === 'sortBy') {
      onFilterChange({ ...activeFilters, sortBy: optionValue });
    } else if (filterKey === 'priceRange') {
      onFilterChange({ ...activeFilters, priceRange: optionValue });
    } else {
      // Multi-select for other filters
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      const newArray = currentArray.includes(optionValue)
        ? currentArray.filter((v: string) => v !== optionValue)
        : [...currentArray, optionValue];
      onFilterChange({ ...activeFilters, [filterKey]: newArray });
    }
    
    setOpenPopover(null);
  };

  const isOptionSelected = (filterKey: string, optionValue: string) => {
    const value = activeFilters[filterKey];
    if (filterKey === 'sortBy') return value === optionValue;
    if (filterKey === 'priceRange') return value === optionValue;
    if (Array.isArray(value)) return value.includes(optionValue);
    return false;
  };

  const hasActiveValue = (filterKey: string) => {
    const value = activeFilters[filterKey];
    if (filterKey === 'sortBy') return value && value !== 'relevance';
    if (Array.isArray(value)) return value.length > 0;
    return !!value;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3 px-1 -mx-1">
      {/* Filter Icon Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFullFilters}
        className={cn(
          "flex-shrink-0 min-h-[44px] min-w-[44px] px-3 rounded-full",
          "bg-background border-border text-foreground",
          "hover:bg-muted transition-colors",
          activeCount > 0 && "border-foreground"
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <Badge 
            variant="default" 
            className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs bg-foreground text-background"
          >
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Dynamic Filter Pills - using enhanced filters */}
      {enhancedQuickFilters.map((filter) => (
        <Popover
          key={filter.key}
          open={openPopover === filter.key}
          onOpenChange={(open) => setOpenPopover(open ? filter.key : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-shrink-0 min-h-[44px] px-4 rounded-full whitespace-nowrap",
                "bg-background border-border text-foreground text-sm font-medium",
                "hover:bg-muted transition-colors",
                hasActiveValue(filter.key) && "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              <span>
                {filter.key === 'sortBy' ? `Sort: ${getDisplayValue(filter)}` : getDisplayValue(filter)}
              </span>
              <ChevronDown className={cn(
                "ml-1.5 h-3.5 w-3.5 transition-transform",
                openPopover === filter.key && "rotate-180"
              )} />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-2 bg-background border border-border shadow-lg rounded-xl"
            align="start"
            sideOffset={8}
          >
            <div className="space-y-1">
              {filter.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(filter.key, option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] flex items-center",
                    isOptionSelected(filter.key, option.value)
                      ? "bg-foreground text-background font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ))}

      {/* Category indicator (subtle) */}
      {detectedCategory && (
        <span className="flex-shrink-0 text-xs text-muted-foreground px-2 capitalize">
          {detectedCategory}
        </span>
      )}
    </div>
  );
};

export default LululemonMobileFilters;
