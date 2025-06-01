
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X, Star, Heart, BadgeCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MobileFilterModalProps {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  categories: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileFilterModal = ({
  activeFilters,
  onFilterChange,
  categories,
  isOpen,
  onOpenChange
}: MobileFilterModalProps) => {
  const PRICE_MAX = 500;
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    activeFilters.priceRange || [0, PRICE_MAX]
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    activeFilters.categories || []
  );

  const handlePriceChange = (value: [number, number]) => {
    setLocalPriceRange(value);
    onFilterChange({ ...activeFilters, priceRange: value });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    onFilterChange({ ...activeFilters, categories: newCategories });
  };

  const handleRatingChange = (rating: string) => {
    onFilterChange({ ...activeFilters, rating: Number(rating) });
  };

  const handleSpecialFilterChange = (key: string, value: boolean) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const clearAllFilters = () => {
    setLocalPriceRange([0, PRICE_MAX]);
    setSelectedCategories([]);
    onFilterChange({
      priceRange: [0, PRICE_MAX],
      categories: [],
      rating: null,
      freeShipping: false,
      favoritesOnly: false,
      sortBy: activeFilters.sortBy || "relevance"
    });
  };

  const activeFilterCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count += 1;
    if (localPriceRange[0] > 0 || localPriceRange[1] < PRICE_MAX) count += 1;
    if (activeFilters.rating) count += 1;
    if (activeFilters.freeShipping) count += 1;
    if (activeFilters.favoritesOnly) count += 1;
    return count;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filters
              {activeFilterCount() > 0 && (
                <Badge variant="secondary">{activeFilterCount()}</Badge>
              )}
            </SheetTitle>
            {activeFilterCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pb-4">
          {/* Price Range */}
          <div>
            <h4 className="font-medium mb-4">Price Range</h4>
            <div className="px-2">
              <Slider
                value={localPriceRange}
                max={PRICE_MAX}
                step={10}
                onValueChange={handlePriceChange}
                className="mb-4"
              />
              <div className="flex items-center justify-between">
                <Badge variant="outline">${localPriceRange[0]}</Badge>
                <Badge variant="outline">
                  {localPriceRange[1] === PRICE_MAX ? "$500+" : `$${localPriceRange[1]}`}
                </Badge>
              </div>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="font-medium mb-4">Categories</h4>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label
                      htmlFor={`mobile-category-${category}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating */}
          <div>
            <h4 className="font-medium mb-4">Rating</h4>
            <RadioGroup
              value={activeFilters.rating?.toString() || ""}
              onValueChange={handleRatingChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="mobile-rating4" />
                <Label htmlFor="mobile-rating4" className="flex items-center">
                  <span className="text-amber-500 mr-2 flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  & up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="mobile-rating3" />
                <Label htmlFor="mobile-rating3" className="flex items-center">
                  <span className="text-amber-500 mr-2 flex">
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  & up
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Special Filters */}
          <div>
            <h4 className="font-medium mb-4">Special Filters</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-free-shipping"
                  checked={activeFilters.freeShipping || false}
                  onCheckedChange={(checked) => handleSpecialFilterChange('freeShipping', checked)}
                />
                <Label htmlFor="mobile-free-shipping" className="flex items-center">
                  <BadgeCheck className="h-4 w-4 mr-2 text-green-500" />
                  Free shipping
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-favorites"
                  checked={activeFilters.favoritesOnly || false}
                  onCheckedChange={(checked) => handleSpecialFilterChange('favoritesOnly', checked)}
                />
                <Label htmlFor="mobile-favorites" className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-red-500" />
                  Favorites only
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="border-t pt-4">
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Apply Filters
            {activeFilterCount() > 0 && ` (${activeFilterCount()})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterModal;
