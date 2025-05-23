
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Props for WishlistCategoryFilter.
 */
type WishlistCategoryFilterProps = {
  selectableCategories: string[];
  categoryFilter: string | null | undefined;
  onCategoryFilterChange: (category: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
};

const WishlistCategoryFilter: React.FC<WishlistCategoryFilterProps> = ({
  selectableCategories,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}) => {
  // Always filter only valid, non-empty, trimmed string categories
  const validCategories = React.useMemo(() =>
    selectableCategories.filter(
      (cat) => typeof cat === "string" && !!cat.trim()
    ),
    [selectableCategories]
  );

  // Warn (dev only) if there's invalid category
  React.useEffect(() => {
    validCategories.forEach((cat) => {
      if (!cat || typeof cat !== "string" || cat.trim().length === 0) {
        console.warn("[WishlistCategoryFilter] Invalid category value in list:", cat);
      }
    });
  }, [validCategories]);

  // Defensive: only allow "" for All Categories (clear)
  const currentValue = categoryFilter && validCategories.includes(categoryFilter)
    ? categoryFilter
    : "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            // If "All Categories" or invalid, clear the filter
            if (!value || !validCategories.includes(value) || value === "") {
              onCategoryFilterChange(null);
            } else {
              onCategoryFilterChange(value);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {validCategories.map((cat, i) => (
              <SelectItem
                key={cat + "-" + i}
                value={cat}
              >
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <div className="relative">
          <Input
            placeholder="Search wishlists..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full"
          />
          {(categoryFilter || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistCategoryFilter;
