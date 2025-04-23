
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FiltersSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
}

const FiltersSidebar = ({ onFilterChange, activeFilters }: FiltersSidebarProps) => {
  const handleFilterChange = (category: string, value: any) => {
    onFilterChange({
      ...activeFilters,
      [category]: value
    });
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="price">
          <AccordionTrigger>Price</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Under $25", "$25 to $50", "$50 to $100", "Over $100"].map((range) => (
                <div key={range} className="flex items-center space-x-2">
                  <Checkbox
                    id={range}
                    checked={activeFilters.price === range}
                    onCheckedChange={() => handleFilterChange("price", range)}
                  />
                  <Label htmlFor={range}>{range}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="color">
          <AccordionTrigger>Color</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Black", "White", "Blue", "Red", "Green"].map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={color}
                    checked={activeFilters.color === color}
                    onCheckedChange={() => handleFilterChange("color", color)}
                  />
                  <Label htmlFor={color}>{color}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="free-shipping"
                  checked={activeFilters.freeShipping}
                  onCheckedChange={() => handleFilterChange("freeShipping", !activeFilters.freeShipping)}
                />
                <Label htmlFor="free-shipping">Free shipping</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => onFilterChange({})}
      >
        Clear all filters
      </Button>
    </div>
  );
};

export default FiltersSidebar;
