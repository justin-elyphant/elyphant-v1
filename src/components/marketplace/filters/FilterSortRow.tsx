import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterSortRowProps {
  activeTab: "all" | "near-you";
  onTabChange: (tab: "all" | "near-you") => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  className?: string;
}

const FilterSortRow: React.FC<FilterSortRowProps> = ({
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-between py-4 border-b border-border", className)}>
      {/* Left: Tabs */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => onTabChange("all")}
          className={cn(
            "text-sm font-medium pb-1 border-b-2 transition-colors min-h-[44px] px-2",
            activeTab === "all"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All Items
        </button>
        <button
          onClick={() => onTabChange("near-you")}
          className={cn(
            "text-sm font-medium pb-1 border-b-2 transition-colors min-h-[44px] px-2",
            activeTab === "near-you"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Available Near You
        </button>
      </div>

      {/* Right: Sort Dropdown */}
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
