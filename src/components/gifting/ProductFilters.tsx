import React from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  priceRange: string;
  filtersVisible: boolean;
  categories: string[];  // This accepts string array (categoryArray)
  setSearchTerm: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setPriceRange: (value: string) => void;
  setFiltersVisible: (value: boolean) => void;
  clearFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  selectedCategory,
  priceRange,
  filtersVisible,
  categories,
  setSearchTerm,
  setSelectedCategory,
  setPriceRange,
  setFiltersVisible,
  clearFilters,
}) => {
  const hasActiveFilters = searchTerm || selectedCategory !== "all" || priceRange !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search gifts..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setFiltersVisible(!filtersVisible)}
            className={filtersVisible ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {filtersVisible && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-md">
          <div>
            <label className="text-sm font-medium block mb-1">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">Price Range</label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under25">Under $25</SelectItem>
                <SelectItem value="25to50">$25 - $50</SelectItem>
                <SelectItem value="50to100">$50 - $100</SelectItem>
                <SelectItem value="over100">Over $100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
