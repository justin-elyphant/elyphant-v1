import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Sparkles } from "lucide-react";
import { DynamicFilterState, DynamicFilterOptions } from "@/types/filters";
import { EnhancedFilterPanel } from "./EnhancedFilterPanel";
import { SmartFilterSuggestions } from "./SmartFilterSuggestions";
import { Product } from "@/types/product";

interface EnhancedMobileFilterSheetProps {
  filters: DynamicFilterState;
  filterOptions: DynamicFilterOptions;
  onUpdateFilter: <K extends keyof DynamicFilterState>(filterType: K, value: DynamicFilterState[K]) => void;
  onApplyFilters: (filters: Partial<DynamicFilterState>) => void;
  onResetFilters: () => void;
  products: Product[];
  filteredProducts: Product[];
  searchContext: any;
  shouldShowBrandFilters: boolean;
  shouldShowAttributeFilters: boolean;
  shouldShowDemographicFilters: boolean;
  shouldShowOccasionFilters: boolean;
}

export const EnhancedMobileFilterSheet: React.FC<EnhancedMobileFilterSheetProps> = ({
  filters,
  filterOptions,
  onUpdateFilter,
  onApplyFilters,
  onResetFilters,
  products,
  filteredProducts,
  searchContext,
  shouldShowBrandFilters,
  shouldShowAttributeFilters,
  shouldShowDemographicFilters,
  shouldShowOccasionFilters
}) => {
  const [open, setOpen] = useState(false);

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    count += filters.selectedBrands.length;
    count += filters.selectedCategories.length;
    count += Object.values(filters.selectedAttributes).flat().length;
    count += filters.selectedOccasions.length;
    count += filters.selectedDemographics.length;
    if (filters.rating) count++;
    if (filters.freeShipping) count++;
    if (filters.favoritesOnly) count++;
    
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handleApplyFilters = () => {
    setOpen(false);
  };

  const quickFilters: Array<{
    label: string;
    filters: Partial<DynamicFilterState>;
    active: boolean;
  }> = [
    { 
      label: "Under $50", 
      filters: { priceRange: [0, 50] as [number, number] },
      active: filters.priceRange[0] === 0 && filters.priceRange[1] === 50
    },
    { 
      label: "Free Shipping", 
      filters: { freeShipping: true },
      active: filters.freeShipping
    },
    { 
      label: "4+ Stars", 
      filters: { rating: 4 },
      active: filters.rating === 4
    },
  ];

  // Add context-aware quick filters
  if (searchContext.gender && !filters.selectedDemographics.includes(searchContext.gender)) {
    quickFilters.unshift({
      label: `${searchContext.gender.charAt(0).toUpperCase() + searchContext.gender.slice(1)}'s`,
      filters: { selectedDemographics: [...filters.selectedDemographics, searchContext.gender] },
      active: false
    });
  }

  const handleQuickFilter = (quickFilter: typeof quickFilters[0]) => {
    if (quickFilter.active) {
      // Remove the filter
      if (quickFilter.filters.priceRange) {
        onUpdateFilter('priceRange', [0, 1000]);
      } else if (quickFilter.filters.freeShipping !== undefined) {
        onUpdateFilter('freeShipping', false);
      } else if (quickFilter.filters.rating !== undefined) {
        onUpdateFilter('rating', null);
      } else if (quickFilter.filters.selectedDemographics) {
        const filterDemographics = quickFilter.filters.selectedDemographics;
        const newDemographics = filters.selectedDemographics.filter(d => 
          !filterDemographics.includes(d)
        );
        onUpdateFilter('selectedDemographics', newDemographics);
      }
    } else {
      // Apply the filter
      Object.entries(quickFilter.filters).forEach(([key, value]) => {
        if (key === 'selectedDemographics') {
          onUpdateFilter(key as keyof DynamicFilterState, value);
        } else {
          onUpdateFilter(key as keyof DynamicFilterState, value);
        }
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-9 px-3 relative"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[90vh] flex flex-col"
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Filters ({filteredProducts.length} results)</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Smart Suggestions */}
          <SmartFilterSuggestions
            searchContext={searchContext}
            onApplySuggestion={onApplyFilters}
            currentFilters={filters}
          />

          {/* Quick Filters */}
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant={filter.active ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter(filter)}
                  className="h-8 px-3 text-sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Detailed Filters */}
          <EnhancedFilterPanel
            filters={filters}
            filterOptions={filterOptions}
            onUpdateFilter={onUpdateFilter}
            products={products}
            filteredProducts={filteredProducts}
            shouldShowBrandFilters={shouldShowBrandFilters}
            shouldShowAttributeFilters={shouldShowAttributeFilters}
            shouldShowDemographicFilters={shouldShowDemographicFilters}
            shouldShowOccasionFilters={shouldShowOccasionFilters}
          />
        </div>

        {/* Apply Button - Fixed at bottom */}
        <div className="border-t pt-4 pb-safe">
          <Button
            onClick={handleApplyFilters}
            className="w-full h-12 text-base font-medium"
          >
            Show {filteredProducts.length} Results
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                {activeFilterCount} filters
              </Badge>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};