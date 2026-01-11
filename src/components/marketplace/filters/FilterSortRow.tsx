import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterSortRowProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  className?: string;
}

const FilterSortRow: React.FC<FilterSortRowProps> = ({
  sortBy,
  onSortChange,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-end py-4 border-b border-border", className)}>
      {/* Sort Dropdown */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px] bg-background border-border">
          <SelectValue placeholder="Sort by: Featured" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Featured</SelectItem>
          <SelectItem value="price-low">Price: Low to High</SelectItem>
          <SelectItem value="price-high">Price: High to Low</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterSortRow;
