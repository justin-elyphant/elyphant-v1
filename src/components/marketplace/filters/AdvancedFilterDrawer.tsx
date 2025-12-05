
import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FilterState, SortByOption, AvailabilityOption } from "@/types/filters";

interface AdvancedFilterDrawerProps {
  filters: FilterState;
  availableCategories: string[];
  activeFilterCount: number;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  filters,
  availableCategories,
  activeFilterCount,
  onUpdateFilters,
  onClearFilters
}) => {
  const isMobile = useIsMobile();

  const handlePriceRangeChange = (values: number[]) => {
    onUpdateFilters({
      priceRange: { min: values[0], max: values[1] }
    });
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    onUpdateFilters({ categories: newCategories });
  };

  const content = (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}
        </Label>
        <Slider
          value={[filters.priceRange.min, filters.priceRange.max]}
          onValueChange={handlePriceRangeChange}
          min={0}
          max={1000}
          step={10}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Categories</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {availableCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => 
                  handleCategoryToggle(category, checked as boolean)
                }
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

      {/* Rating */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Minimum Rating</Label>
        <div className="flex items-center space-x-2">
          <Slider
            value={[filters.minRating]}
            onValueChange={(values) => onUpdateFilters({ minRating: values[0] })}
            min={0}
            max={5}
            step={0.5}
            className="flex-1"
          />
          <div className="flex items-center space-x-1 min-w-16">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{filters.minRating}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Availability</Label>
        <Select 
          value={filters.availability} 
          onValueChange={(value: AvailabilityOption) => 
            onUpdateFilters({ availability: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="pre-order">Pre-order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Sort By */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Sort By</Label>
        <Select 
          value={filters.sortBy} 
          onValueChange={(value: SortByOption) => 
            onUpdateFilters({ sortBy: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Customer Rating</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <div className="w-64 p-4 border-r bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </h3>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-500 hover:text-red-700 h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {content}
        </ScrollArea>
      </div>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative touch-target-44">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 min-w-5 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount} active
                </Badge>
              )}
            </SheetTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <SheetDescription>
            Refine your search to find the perfect products
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4">
            {content}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilterDrawer;
