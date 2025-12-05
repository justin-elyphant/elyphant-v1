import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DynamicFilterState } from "@/types/filters";

interface EnhancedFilterPillsProps {
  filters: DynamicFilterState;
  onRemoveFilter: (filterType: keyof DynamicFilterState, value?: any) => void;
  onClearAll: () => void;
}

export const EnhancedFilterPills: React.FC<EnhancedFilterPillsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll
}) => {
  const getActiveFilters = () => {
    const activeFilters: Array<{ type: keyof DynamicFilterState; label: string; value?: any }> = [];

    // Price range
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      activeFilters.push({
        type: 'priceRange',
        label: `$${filters.priceRange[0]} - $${filters.priceRange[1] === 1000 ? '1000+' : filters.priceRange[1]}`
      });
    }

    // Brands
    filters.selectedBrands.forEach(brand => {
      activeFilters.push({
        type: 'selectedBrands',
        label: brand,
        value: brand
      });
    });

    // Categories
    filters.selectedCategories.forEach(category => {
      activeFilters.push({
        type: 'selectedCategories',
        label: category,
        value: category
      });
    });

    // Attributes (sizes, colors, etc.)
    Object.entries(filters.selectedAttributes).forEach(([attrType, values]) => {
      values.forEach(value => {
        activeFilters.push({
          type: 'selectedAttributes',
          label: `${attrType}: ${value}`,
          value: { attrType, value }
        });
      });
    });

    // Occasions
    filters.selectedOccasions.forEach(occasion => {
      activeFilters.push({
        type: 'selectedOccasions',
        label: occasion.replace('-', ' '),
        value: occasion
      });
    });

    // Demographics
    filters.selectedDemographics.forEach(demo => {
      activeFilters.push({
        type: 'selectedDemographics',
        label: demo,
        value: demo
      });
    });

    // Rating
    if (filters.rating) {
      activeFilters.push({
        type: 'rating',
        label: `${filters.rating}+ stars`
      });
    }

    // Boolean filters
    if (filters.freeShipping) {
      activeFilters.push({
        type: 'freeShipping',
        label: 'Free Shipping'
      });
    }

    if (filters.favoritesOnly) {
      activeFilters.push({
        type: 'favoritesOnly',
        label: 'Favorites Only'
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  const handleRemove = (filter: typeof activeFilters[0]) => {
    if (filter.type === 'selectedAttributes') {
      const { attrType, value } = filter.value;
      const currentValues = filters.selectedAttributes[attrType] || [];
      const newValues = currentValues.filter(v => v !== value);
      onRemoveFilter('selectedAttributes', { [attrType]: newValues });
    } else if (filter.type === 'selectedBrands') {
      const newBrands = filters.selectedBrands.filter(b => b !== filter.value);
      onRemoveFilter('selectedBrands', newBrands);
    } else if (filter.type === 'selectedCategories') {
      const newCategories = filters.selectedCategories.filter(c => c !== filter.value);
      onRemoveFilter('selectedCategories', newCategories);
    } else if (filter.type === 'selectedOccasions') {
      const newOccasions = filters.selectedOccasions.filter(o => o !== filter.value);
      onRemoveFilter('selectedOccasions', newOccasions);
    } else if (filter.type === 'selectedDemographics') {
      const newDemographics = filters.selectedDemographics.filter(d => d !== filter.value);
      onRemoveFilter('selectedDemographics', newDemographics);
    } else if (filter.type === 'priceRange') {
      onRemoveFilter('priceRange', [0, 1000]);
    } else {
      onRemoveFilter(filter.type, filter.type === 'rating' ? null : false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg">
      <span className="text-sm text-muted-foreground font-medium">Active filters:</span>
      
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${filter.label}-${index}`}
          variant="secondary"
          className="flex items-center gap-1 pr-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0.5 hover:bg-transparent"
            onClick={() => handleRemove(filter)}
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
          className="text-muted-foreground hover:text-destructive text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  );
};