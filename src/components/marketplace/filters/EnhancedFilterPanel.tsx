import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Star } from "lucide-react";
import { DynamicFilterState, DynamicFilterOptions } from "@/types/filters";
import { Product } from "@/types/product";

interface EnhancedFilterPanelProps {
  filters: DynamicFilterState;
  filterOptions: DynamicFilterOptions;
  onUpdateFilter: <K extends keyof DynamicFilterState>(filterType: K, value: DynamicFilterState[K]) => void;
  products: Product[];
  filteredProducts: Product[];
  shouldShowBrandFilters: boolean;
  shouldShowAttributeFilters: boolean;
  shouldShowDemographicFilters: boolean;
  shouldShowOccasionFilters: boolean;
}

export const EnhancedFilterPanel: React.FC<EnhancedFilterPanelProps> = ({
  filters,
  filterOptions,
  onUpdateFilter,
  products,
  filteredProducts,
  shouldShowBrandFilters,
  shouldShowAttributeFilters,
  shouldShowDemographicFilters,
  shouldShowOccasionFilters
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    brands: shouldShowBrandFilters,
    categories: true,
    attributes: shouldShowAttributeFilters,
    rating: true
  });

  // Calculate result counts for each filter option
  const getFilterResultCount = (filterType: string, value: string): number => {
    const testFilters = { ...filters };
    
    switch (filterType) {
      case 'brand':
        testFilters.selectedBrands = [value];
        break;
      case 'category':
        testFilters.selectedCategories = [value];
        break;
      default:
        return 0;
    }

    // Apply the test filter and count results
    let testResults = [...products];
    
    if (testFilters.selectedBrands.length > 0) {
      testResults = testResults.filter(product => 
        product.brand && testFilters.selectedBrands.includes(product.brand)
      );
    }
    
    if (testFilters.selectedCategories.length > 0) {
      testResults = testResults.filter(product => 
        product.category && testFilters.selectedCategories.includes(product.category)
      );
    }

    return testResults.length;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked 
      ? [...filters.selectedBrands, brand]
      : filters.selectedBrands.filter(b => b !== brand);
    onUpdateFilter('selectedBrands', newBrands);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...filters.selectedCategories, category]
      : filters.selectedCategories.filter(c => c !== category);
    onUpdateFilter('selectedCategories', newCategories);
  };

  const handleAttributeChange = (attributeType: string, value: string, checked: boolean) => {
    const currentValues = filters.selectedAttributes[attributeType] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onUpdateFilter('selectedAttributes', {
      ...filters.selectedAttributes,
      [attributeType]: newValues
    });
  };

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children, 
    defaultExpanded = false 
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => (
    <Collapsible 
      open={expandedSections[sectionKey] ?? defaultExpanded} 
      onOpenChange={() => toggleSection(sectionKey)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-auto">
          <h3 className="font-medium text-sm">{title}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="space-y-6 p-4 bg-background border rounded-lg">
      {/* Price Range */}
      <FilterSection title="Price Range" sectionKey="price" defaultExpanded>
        <div className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onUpdateFilter('priceRange', value as [number, number])}
            max={1000}
            min={0}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1] === 1000 ? '1000+' : filters.priceRange[1]}</span>
          </div>
        </div>
      </FilterSection>

      {/* Categories */}
      {filterOptions.categories.length > 0 && (
        <FilterSection title="Categories" sectionKey="categories" defaultExpanded>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Array.isArray(filterOptions.categories) && filterOptions.categories.map(category => {
              const resultCount = getFilterResultCount('category', category);
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.selectedCategories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                      {category}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {resultCount}
                  </Badge>
                </div>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Brands */}
      {shouldShowBrandFilters && filterOptions.brands.length > 0 && (
        <FilterSection title="Brands" sectionKey="brands">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.brands.slice(0, 10).map(brand => {
              const resultCount = getFilterResultCount('brand', brand);
              return (
                <div key={brand} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={filters.selectedBrands.includes(brand)}
                      onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                    />
                    <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                      {brand}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {resultCount}
                  </Badge>
                </div>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Product Attributes */}
      {shouldShowAttributeFilters && Object.keys(filterOptions.attributes).length > 0 && (
        <FilterSection title="Product Details" sectionKey="attributes">
          <div className="space-y-4">
            {Object.entries(filterOptions.attributes).map(([attributeType, values]) => (
              <div key={attributeType} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">{attributeType}</h4>
                <div className="flex flex-wrap gap-2">
                  {values.map(value => {
                    const isSelected = (filters.selectedAttributes[attributeType] || []).includes(value);
                    return (
                      <Button
                        key={value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttributeChange(attributeType, value, !isSelected)}
                        className="h-8 px-3 text-xs"
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Rating" sectionKey="rating">
        <div className="space-y-2">
          {[4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={(checked) => 
                  onUpdateFilter('rating', checked ? rating : null)
                }
              />
              <Label htmlFor={`rating-${rating}`} className="flex items-center space-x-1 cursor-pointer">
                <span className="text-sm">{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">& up</span>
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Quick Options */}
      <FilterSection title="Quick Options" sectionKey="options">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-shipping"
              checked={filters.freeShipping}
              onCheckedChange={(checked) => onUpdateFilter('freeShipping', checked as boolean)}
            />
            <Label htmlFor="free-shipping" className="text-sm cursor-pointer">
              Free Shipping
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="favorites-only"
              checked={filters.favoritesOnly}
              onCheckedChange={(checked) => onUpdateFilter('favoritesOnly', checked as boolean)}
            />
            <Label htmlFor="favorites-only" className="text-sm cursor-pointer">
              Favorites Only
            </Label>
          </div>
        </div>
      </FilterSection>
    </div>
  );
};