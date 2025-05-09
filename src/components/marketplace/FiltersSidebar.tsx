
import React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

interface FiltersSidebarProps {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
}

const FiltersSidebar = ({ activeFilters, onFilterChange }: FiltersSidebarProps) => {
  const isMobile = useIsMobile();
  
  const handlePriceChange = (value: string) => {
    const newFilters = { ...activeFilters, price: value };
    onFilterChange(newFilters);
  };
  
  const handleFreeShippingChange = (checked: boolean) => {
    const newFilters = { ...activeFilters, freeShipping: checked };
    onFilterChange(newFilters);
  };
  
  const handleColorChange = (color: string) => {
    const newFilters = { ...activeFilters, color: color === activeFilters.color ? null : color };
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white border rounded-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium">Filters</h3>
      </div>
      
      <ScrollArea className={isMobile ? "h-[50vh] md:h-auto" : "h-auto"}>
        <div className="p-4 space-y-6">
          {/* Price filter */}
          <div>
            <h4 className="font-medium mb-3">Price Range</h4>
            <RadioGroup 
              value={activeFilters.price || ""}
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
          
          <Separator />
          
          {/* Color filter */}
          <div>
            <h4 className="font-medium mb-3">Colors</h4>
            <div className="flex flex-wrap gap-2">
              {["red", "blue", "green", "black", "white"].map(color => (
                <div 
                  key={color}
                  className={`h-8 w-8 rounded-full border-2 cursor-pointer ${
                    activeFilters.color === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                  }`}
                  style={{ backgroundColor: color === 'white' ? '#ffffff' : color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {isMobile && (
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onFilterChange({})}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default FiltersSidebar;
