/**
 * Dynamic Mobile Filter Drawer
 * iOS-optimized with backdrop blur, spring animations, safe areas
 * Uses useSmartFilters for category-aware filtering
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SlidersHorizontal, X, Star, ChevronDown, Heart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useSmartFilters } from "@/hooks/useSmartFilters";
import type { FilterConfig } from "@/components/marketplace/utils/smartFilterDetection";

interface DynamicMobileFilterDrawerProps {
  searchTerm: string;
  products: any[];
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DynamicMobileFilterDrawer: React.FC<DynamicMobileFilterDrawerProps> = ({
  searchTerm,
  products,
  activeFilters,
  onFilterChange,
  isOpen,
  onOpenChange
}) => {
  const { filters, detectedCategory } = useSmartFilters(searchTerm, products);
  const PRICE_MAX = 500;
  
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    activeFilters.priceRange || [0, PRICE_MAX]
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    rating: false,
  });

  // Sync local state with props
  useEffect(() => {
    if (activeFilters.priceRange) {
      setLocalPriceRange(activeFilters.priceRange);
    }
  }, [activeFilters.priceRange]);

  const handlePriceChange = (value: [number, number]) => {
    setLocalPriceRange(value);
    onFilterChange({ ...activeFilters, priceRange: value });
  };

  const handleCheckboxChange = (filterKey: string, value: string) => {
    const currentValues = activeFilters?.[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    
    onFilterChange({ ...activeFilters, [filterKey]: newValues });
  };

  const handleRatingChange = (rating: string) => {
    onFilterChange({ ...activeFilters, rating: Number(rating) });
  };

  const handleSpecialFilterChange = (key: string, value: boolean) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const clearAllFilters = () => {
    setLocalPriceRange([0, PRICE_MAX]);
    onFilterChange({
      priceRange: [0, PRICE_MAX],
      sortBy: activeFilters.sortBy || "relevance"
    });
  };

  const activeFilterCount = () => {
    let count = 0;
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key === 'sortBy') return;
      if (key === 'priceRange') {
        if (value && (value[0] > 0 || value[1] < PRICE_MAX)) count++;
      } else if (Array.isArray(value) && value.length > 0) {
        count++;
      } else if (value) {
        count++;
      }
    });
    return count;
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDynamicFilterSection = (key: string, config: FilterConfig) => {
    if (key === 'price' || key === 'rating') return null;
    
    const options = config.options || [];
    if (options.length === 0) return null;

    const isOpen = openSections[key] ?? false;
    const activeValues = activeFilters?.[key] || [];

    return (
      <Collapsible 
        key={key}
        open={isOpen}
        onOpenChange={() => toggleSection(key)}
        className="border-b border-border pb-4"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 min-h-[44px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{config.label}</span>
            {activeValues.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeValues.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-2 gap-2">
            {options.slice(0, 8).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer min-h-[44px] transition-colors",
                  activeValues.includes(option.value)
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <Checkbox
                  checked={activeValues.includes(option.value)}
                  onCheckedChange={() => handleCheckboxChange(key, option.value)}
                  className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                />
                <span className="text-sm text-foreground truncate">{option.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Get filter order based on category
  const getFilterOrder = () => {
    if (detectedCategory === 'clothing') {
      return ['size', 'waist', 'inseam', 'color', 'fit', 'brand', 'material'];
    }
    if (detectedCategory === 'electronics') {
      return ['brand', 'features'];
    }
    return ['brand', 'color'];
  };

  const filterCount = activeFilterCount();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[85vh] rounded-t-2xl flex flex-col",
          "backdrop-blur-xl bg-background/95",
          "pb-safe" // iOS safe area
        )}
      >
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="h-5 w-5" />
              Filters
              {filterCount > 0 && (
                <Badge variant="secondary" className="bg-foreground text-background">
                  {filterCount}
                </Badge>
              )}
            </SheetTitle>
            {filterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
          {detectedCategory && (
            <p className="text-sm text-muted-foreground capitalize">
              Showing filters for {detectedCategory}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pb-24">
          {/* Price Range - Always first */}
          <Collapsible 
            open={openSections.price}
            onOpenChange={() => toggleSection('price')}
            className="border-b border-border pb-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 min-h-[44px]">
              <span className="font-medium text-foreground">Price Range</span>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                openSections.price && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="px-2">
                <Slider
                  value={localPriceRange}
                  max={PRICE_MAX}
                  step={10}
                  onValueChange={handlePriceChange}
                  className="mb-4"
                />
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-foreground border-border">
                    ${localPriceRange[0]}
                  </Badge>
                  <Badge variant="outline" className="text-foreground border-border">
                    {localPriceRange[1] === PRICE_MAX ? "$500+" : `$${localPriceRange[1]}`}
                  </Badge>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Dynamic Category-Specific Filters */}
          {getFilterOrder().map(key => {
            const config = filters[key];
            if (!config) return null;
            return renderDynamicFilterSection(key, config);
          })}

          {/* Rating Section */}
          <Collapsible 
            open={openSections.rating}
            onOpenChange={() => toggleSection('rating')}
            className="border-b border-border pb-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 min-h-[44px]">
              <span className="font-medium text-foreground">Rating</span>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                openSections.rating && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <RadioGroup
                value={activeFilters.rating?.toString() || ""}
                onValueChange={handleRatingChange}
                className="space-y-2"
              >
                {[4, 3].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer min-h-[44px]"
                  >
                    <RadioGroupItem value={rating.toString()} />
                    <span className="flex items-center text-foreground">
                      <span className="text-amber-500 flex mr-1">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </span>
                      & up
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </CollapsibleContent>
          </Collapsible>

          {/* Favorites Filter */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border min-h-[44px]">
            <Label htmlFor="mobile-favorites" className="flex items-center text-foreground cursor-pointer">
              <Heart className="h-4 w-4 mr-2 text-destructive" />
              Favorites only
            </Label>
            <Checkbox
              id="mobile-favorites"
              checked={activeFilters.favoritesOnly || false}
              onCheckedChange={(checked) => handleSpecialFilterChange('favoritesOnly', Boolean(checked))}
              className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
            />
          </div>
        </div>

        {/* Apply Button - Sticky at bottom */}
        <div 
          className="border-t border-border pt-4 bg-background"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            className="w-full min-h-[48px] bg-foreground text-background hover:bg-foreground/90"
            onClick={() => onOpenChange(false)}
          >
            View Results
            {filterCount > 0 && ` (${filterCount} filters)`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DynamicMobileFilterDrawer;
