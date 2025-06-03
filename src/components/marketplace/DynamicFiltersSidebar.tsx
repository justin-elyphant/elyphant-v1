
import React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { BadgeCheck, Heart, Star, Users, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DynamicFilterState, DynamicFilterOptions, SearchContext } from "@/services/marketplace/searchAnalysisService";

interface DynamicFiltersSidebarProps {
  filters: DynamicFilterState;
  filterOptions: DynamicFilterOptions;
  searchContext: SearchContext;
  onFilterChange: <K extends keyof DynamicFilterState>(filterType: K, value: DynamicFilterState[K]) => void;
  onResetFilters: () => void;
  shouldShowBrandFilters: boolean;
  shouldShowDemographicFilters: boolean;
  shouldShowOccasionFilters: boolean;
  shouldShowAttributeFilters: boolean;
  isMobile?: boolean;
}

const DynamicFiltersSidebar = ({
  filters,
  filterOptions,
  searchContext,
  onFilterChange,
  onResetFilters,
  shouldShowBrandFilters,
  shouldShowDemographicFilters,
  shouldShowOccasionFilters,
  shouldShowAttributeFilters,
  isMobile = false
}: DynamicFiltersSidebarProps) => {
  
  const PRICE_MAX = Math.max(...filterOptions.priceRanges.map(r => r.max === Infinity ? 1000 : r.max));
  
  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.selectedBrands.includes(brand)
      ? filters.selectedBrands.filter(b => b !== brand)
      : [...filters.selectedBrands, brand];
    onFilterChange('selectedBrands', newBrands);
  };
  
  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];
    onFilterChange('selectedCategories', newCategories);
  };
  
  const handleDemographicToggle = (demographic: string) => {
    const newDemographics = filters.selectedDemographics.includes(demographic)
      ? filters.selectedDemographics.filter(d => d !== demographic)
      : [...filters.selectedDemographics, demographic];
    onFilterChange('selectedDemographics', newDemographics);
  };
  
  const handleOccasionToggle = (occasion: string) => {
    const newOccasions = filters.selectedOccasions.includes(occasion)
      ? filters.selectedOccasions.filter(o => o !== occasion)
      : [...filters.selectedOccasions, occasion];
    onFilterChange('selectedOccasions', newOccasions);
  };
  
  // Count active filters
  const activeFilterCount = 
    filters.selectedBrands.length +
    filters.selectedCategories.length +
    filters.selectedDemographics.length +
    filters.selectedOccasions.length +
    (filters.rating ? 1 : 0) +
    (filters.freeShipping ? 1 : 0) +
    (filters.favoritesOnly ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < PRICE_MAX ? 1 : 0);
  
  return (
    <div className="bg-white border rounded-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          Smart Filters
          {searchContext.isGiftContext && <Tag className="h-4 w-4 ml-2 text-green-500" />}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Search Context Info */}
      {(searchContext.gender || searchContext.occasion || searchContext.isGiftContext) && (
        <div className="p-4 border-b bg-blue-50">
          <div className="text-sm text-blue-700 font-medium mb-2">Detected Context:</div>
          <div className="flex flex-wrap gap-1">
            {searchContext.gender && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {searchContext.gender}
              </Badge>
            )}
            {searchContext.occasion && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {searchContext.occasion}
              </Badge>
            )}
            {searchContext.isGiftContext && (
              <Badge variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                Gift
              </Badge>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="p-4 space-y-5">
          
          {/* Demographics Filter - High Priority for Gift Context */}
          {shouldShowDemographicFilters && (
            <>
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  For Whom
                </h4>
                <div className="space-y-2">
                  {['men', 'women', 'boys', 'girls', 'kids', 'adults'].map((demographic) => (
                    <div key={demographic} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`demographic-${demographic}`}
                        checked={filters.selectedDemographics.includes(demographic)}
                        onCheckedChange={() => handleDemographicToggle(demographic)}
                      />
                      <Label 
                        htmlFor={`demographic-${demographic}`}
                        className="text-sm cursor-pointer capitalize"
                      >
                        {demographic}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Occasion Filter - High Priority for Gift Context */}
          {shouldShowOccasionFilters && (
            <>
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Occasion
                </h4>
                <div className="space-y-2">
                  {['birthday', 'christmas', 'wedding', 'graduation', 'anniversary', 'valentines'].map((occasion) => (
                    <div key={occasion} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`occasion-${occasion}`}
                        checked={filters.selectedOccasions.includes(occasion)}
                        onCheckedChange={() => handleOccasionToggle(occasion)}
                      />
                      <Label 
                        htmlFor={`occasion-${occasion}`}
                        className="text-sm cursor-pointer capitalize"
                      >
                        {occasion.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Price Range Filter */}
          <div>
            <h4 className="font-medium mb-3">Price Range</h4>
            <div className="mt-4 px-2">
              <Slider
                value={filters.priceRange}
                max={PRICE_MAX}
                step={10}
                onValueChange={(value: [number, number]) => onFilterChange('priceRange', value)}
                className="mb-6"
              />
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                  ${filters.priceRange[0]}
                </div>
                <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                  {filters.priceRange[1] === PRICE_MAX ? `$${PRICE_MAX}+` : `$${filters.priceRange[1]}`}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Categories Filter */}
          {filterOptions.categories.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <div className="space-y-2">
                  {filterOptions.categories.slice(0, 8).map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`}
                        checked={filters.selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
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
              <Separator />
            </>
          )}
          
          {/* Brand Filter - Only show if multiple brands available */}
          {shouldShowBrandFilters && (
            <>
              <div>
                <h4 className="font-medium mb-3">Brands</h4>
                <div className="space-y-2">
                  {filterOptions.brands.slice(0, 10).map((brand) => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`brand-${brand}`}
                        checked={filters.selectedBrands.includes(brand)}
                        onCheckedChange={() => handleBrandToggle(brand)}
                      />
                      <Label 
                        htmlFor={`brand-${brand}`}
                        className="text-sm cursor-pointer"
                      >
                        {brand}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Rating Filter */}
          <div>
            <h4 className="font-medium mb-3">Rating</h4>
            <RadioGroup 
              value={filters.rating?.toString() || ""}
              onValueChange={(value) => onFilterChange('rating', value ? Number(value) : null)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="rating4" />
                <Label htmlFor="rating4" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1 flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                  & up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="rating3" />
                <Label htmlFor="rating3" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1 flex">
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                  & up
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Special Filters */}
          <div>
            <h4 className="font-medium mb-3">Special Filters</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="freeShipping" 
                  checked={filters.freeShipping}
                  onCheckedChange={(checked) => onFilterChange('freeShipping', Boolean(checked))}
                />
                <Label htmlFor="freeShipping" className="text-sm cursor-pointer flex items-center">
                  <BadgeCheck className="h-4 w-4 mr-1.5 text-green-500" />
                  Free shipping
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="favoritesOnly" 
                  checked={filters.favoritesOnly}
                  onCheckedChange={(checked) => onFilterChange('favoritesOnly', Boolean(checked))}
                />
                <Label htmlFor="favoritesOnly" className="text-sm cursor-pointer flex items-center">
                  <Heart className="h-4 w-4 mr-1.5 text-red-500" />
                  Favorites only
                </Label>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DynamicFiltersSidebar;
