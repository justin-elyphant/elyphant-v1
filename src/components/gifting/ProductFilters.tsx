
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Search, Filter, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile } from "@/hooks/use-mobile";

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

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search gifts..."
            className="w-full pl-8 h-9 md:h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          type="button"
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="flex items-center whitespace-nowrap min-h-9 md:min-h-10 px-2 md:px-3"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1 md:mr-2" />
          <span>{filtersVisible ? "Hide Filters" : "Filters"}</span>
        </Button>
      </div>

      {filtersVisible && (
        <div className="grid gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="category" className="text-sm font-medium mb-1.5 block">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category" className="w-full h-9 md:h-10">
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

          <div>
            <Label htmlFor="priceRange" className="text-sm font-medium mb-1.5 block">Price Range</Label>
            <Select
              value={priceRange}
              onValueChange={setPriceRange}
            >
              <SelectTrigger id="priceRange" className="w-full h-9 md:h-10">
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

          <div className={isMobile ? "" : "md:col-span-2 lg:col-span-1"}>
            <Label className="text-sm font-medium mb-1.5 invisible">Action</Label>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="w-full h-9 md:h-10" 
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
