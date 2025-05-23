
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Props for WishlistCategoryFilter.
 */
type WishlistCategoryFilterProps = {
  /**
   * Array of categories (already filtered and trimmed) - must not include empty strings.
   */
  selectableCategories: string[];
  categoryFilter: string | null | undefined;
  onCategoryFilterChange: (category: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
};

/**
 * Filter selects: no empty value except for "All Categories"
 */
const WishlistCategoryFilter: React.FC<WishlistCategoryFilterProps> = ({
  selectableCategories,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}) => {
  // Defensive filter: Remove all falsy, whitespace, non-string values.
  const validRenderedCategories = React.useMemo(
    () =>
      selectableCategories.filter((cat) => {
        const ok = typeof cat === "string" && !!cat.trim();
        if (!ok) {
          console.error("[WishlistCategoryFilter] Filtering out invalid category for SelectItem:", cat);
        }
        return ok;
      }),
    [selectableCategories]
  );

  // Defensive: Check for any empty string leaking into SelectItem loop
  React.useEffect(() => {
    selectableCategories.forEach((cat) => {
      if (!cat || typeof cat !== "string" || !cat.trim()) {
        console.error("[WishlistCategoryFilter] Invalid 'selectableCategories' item detected at runtime:", cat);
      }
    });
    validRenderedCategories.forEach((cat) => {
      if (cat === "") {
        console.error("[WishlistCategoryFilter] Empty string in validRenderedCategories:", cat);
      }
    });
  }, [selectableCategories, validRenderedCategories]);

  // Defensive: only allow "" for All Categories as value
  const currentValue =
    categoryFilter && validRenderedCategories.includes(categoryFilter)
      ? categoryFilter
      : "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            if (!value || !validRenderedCategories.includes(value) || value === "") {
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
            {validRenderedCategories.map((cat, i) =>
              typeof cat === "string" && cat.trim() !== "" ? (
                <SelectItem key={cat + "-" + i} value={cat}>
                  {cat}
                </SelectItem>
              ) : (
                <div key={"invalid-" + i} className="text-red-500">
                  Invalid category value
                </div>
              )
            )}
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
