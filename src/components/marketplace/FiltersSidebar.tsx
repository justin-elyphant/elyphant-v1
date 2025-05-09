
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
import { XCircle } from "lucide-react";

interface FiltersSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
  onClose?: () => void;
}

const FiltersSidebar = ({ onFilterChange, activeFilters, onClose }: FiltersSidebarProps) => {
  const handleFilterChange = (category: string, value: any) => {
    onFilterChange({
      ...activeFilters,
      [category]: value
    });
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="space-y-6 p-1 sm:p-0">
      <div className="flex justify-between items-center sm:hidden mb-2">
        <h3 className="font-medium">Filters</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <Accordion type="single" collapsible defaultValue="price" className="w-full">
        <AccordionItem value="price">
          <AccordionTrigger className="font-medium py-2 px-1">Budget</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 px-1">
              {[
                { id: "under25", label: "Under $25" },
                { id: "25to50", label: "$25 to $50" },
                { id: "50to100", label: "$50 to $100" },
                { id: "over100", label: "Over $100" }
              ].map((range) => (
                <div key={range.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={range.id}
                    checked={activeFilters.price === range.id}
                    onCheckedChange={() => handleFilterChange("price", range.id)}
                  />
                  <Label htmlFor={range.id} className="text-sm">{range.label}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="color">
          <AccordionTrigger className="py-2 px-1">Color</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 px-1">
              {["Black", "White", "Blue", "Red", "Green"].map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={color}
                    checked={activeFilters.color === color}
                    onCheckedChange={() => handleFilterChange("color", color)}
                  />
                  <Label htmlFor={color} className="text-sm">{color}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="py-2 px-1">Shipping</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 px-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="free-shipping"
                  checked={activeFilters.freeShipping}
                  onCheckedChange={() => handleFilterChange("freeShipping", !activeFilters.freeShipping)}
                />
                <Label htmlFor="free-shipping" className="text-sm">Free shipping</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onFilterChange({})}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
};

export default FiltersSidebar;
