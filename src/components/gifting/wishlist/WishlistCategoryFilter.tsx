
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
  // Strict final filter: Remove all falsy, whitespace, non-string values.
  const validRenderedCategories = React.useMemo(
    () =>
      (selectableCategories || []).filter(
        (cat) =>
          typeof cat === "string" &&
          cat.trim().length > 0 &&
          cat !== ""
      ),
    [selectableCategories]
  );

  // Debug log: RIGHT before rendering, log what will be rendered
  React.useEffect(() => {
    // Defensive: log categories about to be rendered
    validRenderedCategories.forEach((cat, i) => {
      if (typeof cat !== "string" || cat.trim().length === 0 || cat === "") {
        console.error("[WishlistCategoryFilter] Invalid in SelectItem render loop:", cat, i);
      }
    });
    console.log("[WishlistCategoryFilter] About to render categories (should be all valid, non-empty):", validRenderedCategories);
  }, [validRenderedCategories]);

  // Defensive: only allow "" for All Categories as value
  const currentValue =
    typeof categoryFilter === "string" &&
    validRenderedCategories.includes(categoryFilter)
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
            {validRenderedCategories
              .filter(
                (cat) =>
                  typeof cat === "string" &&
                  cat.trim().length > 0 &&
                  cat !== ""
              )
              .map((cat, i) => (
                <SelectItem key={cat + "-" + i} value={cat}>
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

