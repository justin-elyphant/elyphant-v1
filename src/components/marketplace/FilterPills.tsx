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

    // Smart Filters - Gender
    if (filters.gender && filters.gender.length > 0) {
      filters.gender.forEach((gender: string) => {
        activeFilters.push({
          type: 'gender',
          label: gender.charAt(0).toUpperCase() + gender.slice(1),
          value: gender
        });
      });
    }

    // Smart Filters - Brand
    if (filters.brand && filters.brand.length > 0) {
      filters.brand.forEach((brand: string) => {
        activeFilters.push({
          type: 'brand',
          label: brand,
          value: brand
        });
      });
    }

    // Smart Filters - Size (General)
    if (filters.size && filters.size.length > 0) {
      filters.size.forEach((size: string) => {
        activeFilters.push({
          type: 'size',
          label: size,
          value: size
        });
      });
    }

    // Smart Filters - Waist Size
    if (filters.waist && filters.waist.length > 0) {
      filters.waist.forEach((waist: string) => {
        activeFilters.push({
          type: 'waist',
          label: `Waist ${waist}"`,
          value: waist
        });
      });
    }

    // Smart Filters - Inseam Length
    if (filters.inseam && filters.inseam.length > 0) {
      filters.inseam.forEach((inseam: string) => {
        activeFilters.push({
          type: 'inseam',
          label: `Inseam ${inseam}"`,
          value: inseam
        });
      });
    }

    // Smart Filters - Material
    if (filters.material && filters.material.length > 0) {
      filters.material.forEach((material: string) => {
        activeFilters.push({
          type: 'material',
          label: material,
          value: material
        });
      });
    }

    // Smart Filters - Style
    if (filters.style && filters.style.length > 0) {
      filters.style.forEach((style: string) => {
        activeFilters.push({
          type: 'style',
          label: style,
          value: style
        });
      });
    }

    // Smart Filters - Features
    if (filters.features && filters.features.length > 0) {
      filters.features.forEach((feature: string) => {
        activeFilters.push({
          type: 'features',
          label: feature,
          value: feature
        });
      });
    }

    // Smart Filters - Color
    if (filters.color && filters.color.length > 0) {
      filters.color.forEach((color: string) => {
        activeFilters.push({
          type: 'color',
          label: color.charAt(0).toUpperCase() + color.slice(1),
          value: color
        });
      });
    }

    // Smart Filters - Fit
    if (filters.fit && filters.fit.length > 0) {
      filters.fit.forEach((fit: string) => {
        activeFilters.push({
          type: 'fit',
          label: fit.charAt(0).toUpperCase() + fit.slice(1),
          value: fit
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
              // Smart filters and categories use value-based removal
              if (['category', 'gender', 'brand', 'size', 'color', 'fit', 'waist', 'inseam', 'material', 'style', 'features'].includes(filter.type)) {
                onRemoveFilter(filter.type, filter.value);
              } else {
                // Single-value filters use type-based removal
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