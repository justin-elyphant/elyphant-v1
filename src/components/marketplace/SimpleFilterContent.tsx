import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface SimpleFilterContentProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  categories: string[];
}

const SimpleFilterContent = ({
  filters,
  onFiltersChange,
  categories,
}: SimpleFilterContentProps) => {
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

  const handleFreeShippingChange = (checked: boolean) => {
    onFiltersChange({ ...filters, freeShipping: checked });
  };

  const clearFilters = () => {
    setPriceValues([0, PRICE_MAX]);
    setSelectedCategories([]);
    onFiltersChange({
      priceRange: [0, PRICE_MAX],
      categories: [],
      rating: null,
      freeShipping: false,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count += 1;
    if (priceValues[0] > 0 || priceValues[1] < PRICE_MAX) count += 1;
    if (filters.rating) count += 1;
    if (filters.freeShipping) count += 1;
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
          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Categories</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <Label 
                      htmlFor={`category-${category}`}
                      className="text-sm cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && <Separator />}

          {/* Price Range */}
          <div>
            <h4 className="font-medium mb-3">Price Range</h4>
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

          <Separator />

          {/* Rating */}
          <div>
            <h4 className="font-medium mb-3">Rating</h4>
            <RadioGroup 
              value={filters.rating?.toString() || ""}
              onValueChange={handleRatingChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="rating4" />
                <Label htmlFor="rating4" className="text-sm cursor-pointer flex items-center">
                  <div className="flex mr-1">
                    {[1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                    <Star className="h-3 w-3 text-gray-300" />
                  </div>
                  4★ & Up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="rating3" />
                <Label htmlFor="rating3" className="text-sm cursor-pointer flex items-center">
                  <div className="flex mr-1">
                    {[1, 2, 3].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                    {[4, 5].map((star) => (
                      <Star key={star} className="h-3 w-3 text-gray-300" />
                    ))}
                  </div>
                  3★ & Up
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Free Shipping */}
          <div>
            <h4 className="font-medium mb-3">Shipping</h4>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="free-shipping"
                checked={filters.freeShipping || false}
                onCheckedChange={handleFreeShippingChange}
              />
              <Label htmlFor="free-shipping" className="text-sm cursor-pointer">
                Free Shipping
              </Label>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SimpleFilterContent;