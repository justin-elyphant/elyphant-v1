import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { generateSmartFilters, type FilterConfig, type FilterOption } from "./utils/smartFilterDetection";
import { useSearchParams } from "react-router-dom";

interface SimpleFilterContentProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  categories: string[];
  products?: any[]; // Add products prop for smart detection
}

const SimpleFilterContent = ({
  filters,
  onFiltersChange,
  categories,
  products = [],
}: SimpleFilterContentProps) => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  // Generate smart filters based on search context and products
  const smartFilterContext = useMemo(() => {
    console.log(`🎯 Generating smart filters for "${searchTerm}" with ${products.length} products`);
    const context = generateSmartFilters(searchTerm, products);
    console.log(`🎯 Smart filter context generated:`, context);
    return context;
  }, [searchTerm, products]);
  
  const PRICE_MAX = 500;
  const [priceValues, setPriceValues] = useState<[number, number]>(
    filters.priceRange ? [
      Math.max(0, Math.min(filters.priceRange[0] || 0, PRICE_MAX)),
      Math.max(0, Math.min(filters.priceRange[1] || PRICE_MAX, PRICE_MAX))
    ] : [0, PRICE_MAX]
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.categories || []
  );

  const handlePriceChange = (value: [number, number]) => {
    setPriceValues(value);
    onFiltersChange({ ...filters, priceRange: value });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category) 
        ? prev.filter(cat => cat !== category)
        : [...prev, category];
      
      onFiltersChange({ ...filters, categories: newCategories });
      return newCategories;
    });
  };

  const handleRatingChange = (value: string) => {
    onFiltersChange({ ...filters, rating: Number(value) });
  };


  const clearFilters = () => {
    setPriceValues([0, PRICE_MAX]);
    setSelectedCategories([]);
    onFiltersChange({
      priceRange: [0, PRICE_MAX],
      categories: [],
      rating: null,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count += 1;
    if (priceValues[0] > 0 || priceValues[1] < PRICE_MAX) count += 1;
    if (filters.rating) count += 1;
    return count;
  };

  const activeFilterCount = getActiveFiltersCount();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4">
          {/* Smart Context Info */}
          {smartFilterContext.detectedCategory && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <Badge variant="outline" className="mr-2">
                  {smartFilterContext.detectedCategory}
                </Badge>
                Showing filters for {smartFilterContext.detectedCategory} products
              </p>
            </div>
          )}

          {/* Dynamic Smart Filters */}
          {Object.entries(smartFilterContext.suggestedFilters).map(([filterKey, filterConfig]: [string, FilterConfig]) => {
            if (filterKey === 'price') {
              return (
                <div key={filterKey}>
                  <h4 className="font-medium mb-3">{filterConfig.label}</h4>
                  <div className="px-2">
                    <Slider
                      value={priceValues}
                      max={PRICE_MAX}
                      step={10}
                      onValueChange={handlePriceChange}
                      className="mb-6"
                    />
                    <div className="flex items-center justify-between">
                      <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                        ${priceValues[0]}
                      </div>
                      <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                        {priceValues[1] === PRICE_MAX ? "$500+" : `$${priceValues[1]}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            if (filterKey === 'rating') {
              return (
                <div key={filterKey}>
                  <h4 className="font-medium mb-3">{filterConfig.label}</h4>
                  <RadioGroup 
                    value={filters.rating?.toString() || ""}
                    onValueChange={handleRatingChange}
                    className="space-y-2"
                  >
                    {filterConfig.options?.map((option: FilterOption) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`rating${option.value}`} />
                        <Label htmlFor={`rating${option.value}`} className="text-sm cursor-pointer flex items-center">
                          <div className="flex mr-1">
                            {Array.from({ length: Number(option.value) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                            {Array.from({ length: 5 - Number(option.value) }).map((_, i) => (
                              <Star key={i + Number(option.value)} className="h-3 w-3 text-gray-300" />
                            ))}
                          </div>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            }
            
            
            // Dynamic checkbox filters (brand, size, color, fit, etc.)
            if (filterConfig.type === 'checkbox' && filterConfig.options?.length > 0) {
              return (
                <div key={filterKey}>
                  <h4 className="font-medium mb-3">{filterConfig.label}</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filterConfig.options?.map((option: FilterOption) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`${filterKey}-${option.value}`}
                          checked={(filters[filterKey] || []).includes(option.value)}
                          onCheckedChange={(checked) => {
                            const currentValues = filters[filterKey] || [];
                            const newValues = checked 
                              ? [...currentValues, option.value]
                              : currentValues.filter((v: string) => v !== option.value);
                            onFiltersChange({ ...filters, [filterKey]: newValues });
                          }}
                        />
                        <Label 
                          htmlFor={`${filterKey}-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            
            return null;
          })}
          
          {/* Add separators between sections */}
          {Object.keys(smartFilterContext.suggestedFilters).map((_, index, array) => (
            index < array.length - 1 ? <Separator key={`sep-${index}`} /> : null
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SimpleFilterContent;