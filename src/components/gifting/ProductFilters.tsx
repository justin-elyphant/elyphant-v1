
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileFilterSheet from "@/components/marketplace/mobile/MobileFilterSheet";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  filtersVisible: boolean;
  setFiltersVisible: (value: boolean) => void;
  categories: string[];
  clearFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  filtersVisible,
  setFiltersVisible,
  categories = [],
  clearFilters
}) => {
  const isMobile = useIsMobile();

  const activeFilterCount = [
    selectedCategory !== "all" ? 1 : 0,
    priceRange !== "all" ? 1 : 0,
    searchTerm ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-3 md:space-y-4 safe-area-inset mobile-grid-optimized">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search gifts..."
            className="w-full pl-8 h-10 md:h-10 touch-target-48 touch-manipulation bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isMobile ? (
          <MobileFilterSheet
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            categories={categories}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount - (searchTerm ? 1 : 0)} // Exclude search from mobile filter count
          />
        ) : (
          <Button
            variant="outline"
            size="default"
            type="button"
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="flex items-center whitespace-nowrap h-10 px-4 touch-target-48 touch-manipulation tap-feedback no-select border-gray-200 hover:border-gray-300"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <span>{filtersVisible ? "Hide Filters" : "Filters"}</span>
          </Button>
        )}
      </div>

      {/* Desktop filters - only show when not mobile and filters are visible */}
      {!isMobile && filtersVisible && (
        <div className="grid gap-4 rounded-lg border border-gray-200 p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3 safe-area-inset bg-white">
          <div>
            <Label htmlFor="category" className="text-sm font-medium mb-2 block leading-relaxed">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category" className="w-full h-10 touch-target-48 touch-manipulation border-gray-200">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border-gray-200">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.sort().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priceRange" className="text-sm font-medium mb-2 block leading-relaxed">Price Range</Label>
            <Select
              value={priceRange}
              onValueChange={setPriceRange}
            >
              <SelectTrigger id="priceRange" className="w-full h-10 touch-target-48 touch-manipulation border-gray-200">
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border-gray-200">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under25">Under $25</SelectItem>
                <SelectItem value="25to50">$25 to $50</SelectItem>
                <SelectItem value="50to100">$50 to $100</SelectItem>
                <SelectItem value="over100">Over $100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 lg:col-span-1 flex items-end">
            <Button 
              variant="outline" 
              size="default"
              className="w-full h-10 touch-target-48 touch-manipulation tap-feedback no-select border-gray-200 hover:border-gray-300" 
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
