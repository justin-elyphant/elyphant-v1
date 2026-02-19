import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface DesktopFilterSidebarProps {
  productCount: number;
  activeFilters: any;
  onFilterChange: (filters: any) => void;
  className?: string;
}

const DesktopFilterSidebar: React.FC<DesktopFilterSidebarProps> = ({
  productCount,
  activeFilters,
  onFilterChange,
  className
}) => {
  const [priceOpen, setPriceOpen] = useState(true);
  const [genderOpen, setGenderOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Price range state (in dollars)
  const [priceRange, setPriceRange] = useState<[number, number]>(
    activeFilters?.priceRange || [0, 300]
  );

  // Categories list
  const categories = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Sports",
    "Books",
    "Toys & Games",
    "Beauty",
    "Health",
    "Automotive",
    "Pet Supplies"
  ];

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);
    onFilterChange({
      ...activeFilters,
      priceRange: newRange
    });
  };

  const handleGenderToggle = (gender: string) => {
    const currentGenders = activeFilters?.gender || [];
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter((g: string) => g !== gender)
      : [...currentGenders, gender];
    
    onFilterChange({
      ...activeFilters,
      gender: newGenders
    });
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = activeFilters?.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c: string) => c !== category)
      : [...currentCategories, category];
    
    onFilterChange({
      ...activeFilters,
      categories: newCategories
    });
  };

  const handleRatingToggle = (rating: number) => {
    const currentRating = activeFilters?.rating || 0;
    const newRating = currentRating === rating ? 0 : rating;
    
    onFilterChange({
      ...activeFilters,
      rating: newRating
    });
  };

  return (
    <aside className={cn("w-64 flex-shrink-0 sticky top-24 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto", className)}>
      {/* Title with product count */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Gift Ideas</h2>
        <p className="text-sm text-muted-foreground mt-1">{productCount} products</p>
      </div>

      {/* Price Filter */}
      <Collapsible open={priceOpen} onOpenChange={setPriceOpen} className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>Price</span>
          <Minus className={cn("h-4 w-4 transition-transform", !priceOpen && "rotate-90")} />
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

      {/* Gender Filter */}
      <Collapsible open={genderOpen} onOpenChange={setGenderOpen} className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>Gender</span>
          <Minus className={cn("h-4 w-4 transition-transform", !genderOpen && "rotate-90")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {['Women', 'Men', 'Unisex'].map((gender) => (
            <label
              key={gender}
              className="flex items-center space-x-3 cursor-pointer min-h-[44px] py-1"
            >
              <Checkbox
                checked={(activeFilters?.gender || []).includes(gender)}
                onCheckedChange={() => handleGenderToggle(gender)}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
              />
              <span className="text-sm text-foreground">{gender}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Category Filter */}
      <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen} className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>Category</span>
          <Minus className={cn("h-4 w-4 transition-transform", !categoryOpen && "rotate-90")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {visibleCategories.map((category) => (
            <label
              key={category}
              className="flex items-center space-x-3 cursor-pointer min-h-[44px] py-1"
            >
              <Checkbox
                checked={(activeFilters?.categories || []).includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
              />
              <span className="text-sm text-foreground">{category}</span>
            </label>
          ))}
          {!showAllCategories && categories.length > 5 && (
            <button
              onClick={() => setShowAllCategories(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
            >
              View More +
            </button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Rating Filter */}
      <Collapsible open={ratingOpen} onOpenChange={setRatingOpen} className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors min-h-[44px]">
          <span>Rating</span>
          <Minus className={cn("h-4 w-4 transition-transform", !ratingOpen && "rotate-90")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {[4, 3].map((rating) => (
            <label
              key={rating}
              className="flex items-center space-x-3 cursor-pointer min-h-[44px] py-1"
            >
              <Checkbox
                checked={(activeFilters?.rating || 0) === rating}
                onCheckedChange={() => handleRatingToggle(rating)}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
              />
              <span className="text-sm text-foreground">{rating}★ & Up</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
};

export default DesktopFilterSidebar;
