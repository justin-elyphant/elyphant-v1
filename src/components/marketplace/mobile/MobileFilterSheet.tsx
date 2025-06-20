
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface MobileFilterSheetProps {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  categories: string[];
  clearFilters: () => void;
  activeFilterCount: number;
  children?: React.ReactNode;
}

const MobileFilterSheet = ({
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  categories = [],
  clearFilters,
  activeFilterCount,
  children
}: MobileFilterSheetProps) => {
  const [open, setOpen] = React.useState(false);

  const handleApplyFilters = () => {
    setOpen(false);
  };

  const quickFilters = [
    { label: "Under $25", value: "under25", type: "price" },
    { label: "$25-50", value: "25to50", type: "price" },
    { label: "$50-100", value: "50to100", type: "price" },
    { label: "Electronics", value: "Electronics", type: "category" },
    { label: "Home & Garden", value: "Home & Garden", type: "category" },
    { label: "Fashion", value: "Fashion", type: "category" },
  ];

  const isQuickFilterActive = (filter: any) => {
    if (filter.type === "price") {
      return priceRange === filter.value;
    }
    return selectedCategory === filter.value;
  };

  const handleQuickFilter = (filter: any) => {
    if (filter.type === "price") {
      setPriceRange(isQuickFilterActive(filter) ? "all" : filter.value);
    } else {
      setSelectedCategory(isQuickFilterActive(filter) ? "all" : filter.value);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-9 px-3 touch-target-44 touch-manipulation tap-feedback no-select relative"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 text-white"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[85vh] safe-area-inset mobile-grid-optimized"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-500 hover:text-red-700 touch-target-44 touch-manipulation tap-feedback no-select"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-20">
          {/* Quick Filters */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-gray-900">Quick Filters</h3>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={`${filter.type}-${filter.value}`}
                  variant={isQuickFilterActive(filter) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter(filter)}
                  className="h-8 px-3 text-sm touch-target-44 touch-manipulation tap-feedback no-select"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-gray-900">Category</h3>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full h-10 touch-target-44 touch-manipulation">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.sort().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-gray-900">Price Range</h3>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full h-10 touch-target-44 touch-manipulation">
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under25">Under $25</SelectItem>
                <SelectItem value="25to50">$25 to $50</SelectItem>
                <SelectItem value="50to100">$50 to $100</SelectItem>
                <SelectItem value="over100">Over $100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {children}
        </div>

        {/* Apply Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t safe-area-inset">
          <Button
            onClick={handleApplyFilters}
            className="w-full h-12 text-base font-medium touch-target-48 touch-manipulation tap-feedback no-select"
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

export default MobileFilterSheet;
