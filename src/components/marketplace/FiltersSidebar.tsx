
import React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface FiltersSidebarProps {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  categories?: string[];
}

const FiltersSidebar = ({ activeFilters, onFilterChange, categories = [] }: FiltersSidebarProps) => {
  const isMobile = useIsMobile();
  
  const handlePriceChange = (value: string) => {
    const newFilters = { ...activeFilters, priceRange: value };
    onFilterChange(newFilters);
  };
  
  const handleFreeShippingChange = (checked: boolean) => {
    const newFilters = { ...activeFilters, freeShipping: checked };
    onFilterChange(newFilters);
  };
  
  const handleCategoryChange = (value: string) => {
    const newFilters = { ...activeFilters, category: value };
    onFilterChange(newFilters);
  };
  
  const handleRatingChange = (value: string) => {
    const newFilters = { ...activeFilters, rating: Number(value) };
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white border rounded-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium">Filters</h3>
      </div>
      
      <ScrollArea className={isMobile ? "h-[50vh] md:h-auto" : "h-auto"}>
        <div className="p-4 space-y-6">
          {/* Category filter - new section */}
          {categories.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">Category</h4>
                <Select 
                  value={activeFilters.category || ""} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
            </>
          )}
          
          {/* Price filter */}
          <div>
            <h4 className="font-medium mb-3">Price Range</h4>
            <RadioGroup 
              value={activeFilters.priceRange || ""}
              onValueChange={handlePriceChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="under25" id="under25" className="h-5 w-5" />
                <Label htmlFor="under25" className="text-sm cursor-pointer">Under $25</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="25to50" id="25to50" className="h-5 w-5" />
                <Label htmlFor="25to50" className="text-sm cursor-pointer">$25 to $50</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="50to100" id="50to100" className="h-5 w-5" />
                <Label htmlFor="50to100" className="text-sm cursor-pointer">$50 to $100</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="over100" id="over100" className="h-5 w-5" />
                <Label htmlFor="over100" className="text-sm cursor-pointer">Over $100</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Rating filter - new section */}
          <div>
            <h4 className="font-medium mb-3">Rating</h4>
            <RadioGroup 
              value={activeFilters.rating?.toString() || ""}
              onValueChange={handleRatingChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="rating4" className="h-5 w-5" />
                <Label htmlFor="rating4" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1">★★★★</span> & up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="rating3" className="h-5 w-5" />
                <Label htmlFor="rating3" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1">★★★</span> & up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="rating2" className="h-5 w-5" />
                <Label htmlFor="rating2" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1">★★</span> & up
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Free shipping filter */}
          <div>
            <h4 className="font-medium mb-3">Shipping</h4>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="freeShipping" 
                checked={activeFilters.freeShipping || false}
                onCheckedChange={handleFreeShippingChange}
                className="h-5 w-5"
              />
              <Label htmlFor="freeShipping" className="text-sm cursor-pointer">Free shipping</Label>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onFilterChange({
            priceRange: null,
            category: null,
            rating: null,
            freeShipping: false,
            sortBy: activeFilters.sortBy || "relevance"
          })}
          className="w-full"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

export default FiltersSidebar;
