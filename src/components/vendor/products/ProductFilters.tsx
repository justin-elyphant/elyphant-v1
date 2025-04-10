
import React from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductFiltersProps {
  activeCategory: string;
  fulfillmentFilter: string;
  setFulfillmentFilter: (filter: string) => void;
}

export const ProductFilters = ({ 
  activeCategory, 
  fulfillmentFilter, 
  setFulfillmentFilter 
}: ProductFiltersProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <span className="text-sm text-muted-foreground">
          Showing {activeCategory === "all" ? "all" : activeCategory} products
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-sm text-muted-foreground">Fulfillment:</label>
        <Select 
          value={fulfillmentFilter} 
          onValueChange={setFulfillmentFilter}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Filter by fulfillment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="physical">Physical Shipping</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="pickup">In-Store Pickup</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </div>
    </div>
  );
};
