
import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Check } from "lucide-react";
import { Product } from "@/types/product";

interface MobileFilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  sortOption: string;
  setSortOption: (option: string) => void;
  onFiltersChange: (count: number) => void;
}

const MobileFilterBottomSheet = ({
  open,
  onOpenChange,
  products,
  sortOption,
  setSortOption,
  onFiltersChange
}: MobileFilterBottomSheetProps) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");

  // Extract unique categories from products
  const categories = Array.from(new Set(
    products.map(p => p.category || p.category_name).filter(Boolean)
  )).sort();

  const quickFilters = [
    { label: "Under $25", value: "under25", type: "price" },
    { label: "$25-50", value: "25to50", type: "price" },
    { label: "$50-100", value: "50to100", type: "price" },
    { label: "Over $100", value: "over100", type: "price" },
  ];

  const popularCategories = categories.slice(0, 6);

  useEffect(() => {
    const filterCount = [
      selectedCategory !== "all" ? 1 : 0,
      selectedPriceRange !== "all" ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0);
    
    onFiltersChange(filterCount);
  }, [selectedCategory, selectedPriceRange, onFiltersChange]);

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedPriceRange("all");
  };

  const isQuickFilterActive = (filter: any) => {
    if (filter.type === "price") {
      return selectedPriceRange === filter.value;
    }
    return selectedCategory === filter.value;
  };

  const handleQuickFilter = (filter: any) => {
    if (filter.type === "price") {
      setSelectedPriceRange(isQuickFilterActive(filter) ? "all" : filter.value);
    } else {
      setSelectedCategory(isQuickFilterActive(filter) ? "all" : filter.value);
    }
  };

  const activeFilterCount = [
    selectedCategory !== "all" ? 1 : 0,
    selectedPriceRange !== "all" ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] safe-area-inset rounded-t-xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between text-left">
            <span>Filters & Sort</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-20 overflow-y-auto">
          {/* Sort Options */}
          <div>
            <h3 className="font-medium text-base mb-3 text-gray-900">Sort By</h3>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Quick Price Filters */}
          <div>
            <h3 className="font-medium text-base mb-3 text-gray-900">Price Range</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={isQuickFilterActive(filter) ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleQuickFilter(filter)}
                  className="h-12 text-base justify-center"
                >
                  {isQuickFilterActive(filter) && (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Categories */}
          <div>
            <h3 className="font-medium text-base mb-3 text-gray-900">Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {popularCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedCategory(selectedCategory === category ? "all" : category)}
                  className="h-12 text-base justify-center"
                >
                  {selectedCategory === category && (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* All Categories Dropdown */}
          {categories.length > 6 && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700">All Categories</h4>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Apply Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t safe-area-inset">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 text-base font-medium"
          >
            Apply Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-blue-600">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterBottomSheet;
