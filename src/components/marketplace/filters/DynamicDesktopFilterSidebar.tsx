/**
 * Dynamic Desktop Filter Sidebar
 * Uses useSmartFilters for category-aware filtering
 * Lululemon-inspired collapsible sections
 */

import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Minus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useSmartFilters } from "@/hooks/useSmartFilters";
import type { FilterConfig } from "@/components/marketplace/utils/smartFilterDetection";

interface DynamicDesktopFilterSidebarProps {
  searchTerm: string;
  products: any[];
  productCount: number;
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
  // Phase 4: Server-side facets
  serverFacets?: {
    brands?: Array<{ name: string; count: number }>;
    priceRanges?: Array<{ label: string; min: number; max: number; count: number }>;
    categories?: Array<{ name: string; count: number }>;
  };
}

const DynamicDesktopFilterSidebar: React.FC<DynamicDesktopFilterSidebarProps> = ({
  searchTerm,
  products,
  productCount,
  activeFilters,
  onFilterChange,
  className,
  serverFacets
}) => {
  const { filters, detectedCategory } = useSmartFilters(searchTerm, products);
  
  // Merge server facets with local filters - prefer server data when available
  const brandOptions = serverFacets?.brands?.map(b => ({ 
    value: b.name, 
    label: b.name,
    count: b.count 
  })) || filters.brand?.options || [];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    rating: true,
  });
  const [showMoreOptions, setShowMoreOptions] = useState<Record<string, boolean>>({});

  // Price range state
  const [priceRange, setPriceRange] = useState<[number, number]>(
    activeFilters?.priceRange || [0, 300]
  );

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);
    onFilterChange({ ...activeFilters, priceRange: newRange });
  };

  const handleCheckboxChange = (filterKey: string, value: string) => {
    const currentValues = activeFilters?.[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    
    onFilterChange({ ...activeFilters, [filterKey]: newValues });
  };

  const handleRatingChange = (rating: number) => {
    const currentRating = activeFilters?.rating || 0;
    onFilterChange({ 
      ...activeFilters, 
      rating: currentRating === rating ? 0 : rating 
    });
  };

  const renderFilterSection = (key: string, config: FilterConfig) => {
    // Skip price and rating - they're handled separately
    if (key === 'price' || key === 'rating') return null;

    const isOpen = openSections[key] ?? true;
    const options = config.options || [];
    const showMore = showMoreOptions[key] || false;
    const visibleOptions = showMore ? options : options.slice(0, 5);

    return (
      <Collapsible 
        key={key} 
        open={isOpen} 
        onOpenChange={() => toggleSection(key)} 
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>{config.label}</span>
          <Minus className={cn("h-4 w-4 transition-transform", !isOpen && "rotate-90")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {visibleOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 cursor-pointer min-h-[44px] py-1"
            >
              <Checkbox
                checked={(activeFilters?.[key] || []).includes(option.value)}
                onCheckedChange={() => handleCheckboxChange(key, option.value)}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
              />
              <span className="text-sm text-foreground flex-1">{option.label}</span>
              {option.count && (
                <span className="text-xs text-muted-foreground">({option.count})</span>
              )}
            </label>
          ))}
          {options.length > 5 && !showMore && (
            <button
              onClick={() => setShowMoreOptions(prev => ({ ...prev, [key]: true }))}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
            >
              View More +
            </button>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Determine filter order based on category
  const getFilterOrder = () => {
    if (detectedCategory === 'clothing') {
      return ['brand', 'size', 'waist', 'inseam', 'color', 'fit', 'material', 'style', 'features', 'gender'];
    }
    if (detectedCategory === 'electronics') {
      return ['brand', 'features'];
    }
    return ['brand', 'color', 'size'];
  };

  const filterOrder = getFilterOrder();

  return (
    <aside className={cn(
      "w-64 flex-shrink-0 sticky top-24 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto",
      className
    )}>
      {/* Title with product count */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {detectedCategory 
            ? detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1)
            : 'Gift Ideas'
          }
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{productCount} products</p>
      </div>

      {/* Price Filter - Always visible */}
      <Collapsible 
        open={openSections.price} 
        onOpenChange={() => toggleSection('price')} 
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>Price</span>
          <Minus className={cn("h-4 w-4 transition-transform", !openSections.price && "rotate-90")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            min={0}
            max={300}
            step={5}
            value={priceRange}
            onValueChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Dynamic Category-Specific Filters */}
      {filterOrder.map(key => {
        const config = filters[key];
        if (!config) return null;
        return renderFilterSection(key, config);
      })}

      {/* Rating Filter - Always visible */}
      <Collapsible 
        open={openSections.rating} 
        onOpenChange={() => toggleSection('rating')} 
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>Rating</span>
          <Minus className={cn("h-4 w-4 transition-transform", !openSections.rating && "rotate-90")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {[4, 3].map((rating) => (
            <label
              key={rating}
              className="flex items-center space-x-3 cursor-pointer min-h-[44px] py-1"
            >
              <Checkbox
                checked={(activeFilters?.rating || 0) === rating}
                onCheckedChange={() => handleRatingChange(rating)}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
              />
              <span className="text-sm text-foreground flex items-center">
                {rating}
                <Star className="h-3.5 w-3.5 ml-0.5 fill-current text-amber-500" />
                <span className="ml-1">& Up</span>
              </span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
};

export default DynamicDesktopFilterSidebar;
