
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getValidCategories, logInvalidCategories } from "./utils/validCategoryUtils";

type WishlistCategoryFilterProps = {
  selectableCategories: string[];
  categoryFilter: string | null | undefined;
  onCategoryFilterChange: (category: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
};

// Strict utility: unique, trimmed, non-empty string categories only
function getStrictValidCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  return Array.from(
    new Set(
      categories
        .map((cat) => (typeof cat === "string" ? cat.trim() : ""))
        .filter((cat) => !!cat && typeof cat === "string" && cat.length > 0 && cat !== "")
    )
  );
}

const WishlistCategoryFilter: React.FC<WishlistCategoryFilterProps> = ({
  selectableCategories,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}) => {
  // Filter categories to ensure no empty strings
  const filteredCategories = React.useMemo(
    () => getStrictValidCategories(selectableCategories),
    [selectableCategories]
  );

  // DEV LOGGING for debugging category issues
  if (process.env.NODE_ENV === "development") {
    if (Array.isArray(selectableCategories)) {
      selectableCategories.forEach((cat, i) => {
        if (typeof cat !== "string" || cat.trim().length === 0) {
          // eslint-disable-next-line no-console
          console.error(`[WishlistCategoryFilter][DEV] Invalid category in selectableCategories at index ${i}:`, cat);
        }
      });
    }
    filteredCategories.forEach((cat, i) => {
      if (!cat || typeof cat !== "string" || cat.trim().length === 0) {
        // eslint-disable-next-line no-console
        console.error(`[WishlistCategoryFilter][DEV] Invalid filtered category at index ${i}:`, cat);
      }
    });
  }

  // Only allow a valid value or blank for "All Categories"
  const currentValue =
    typeof categoryFilter === "string" &&
    filteredCategories.includes(categoryFilter) &&
    categoryFilter.trim().length > 0
      ? categoryFilter
      : "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            if (!value || value === "" || !filteredCategories.includes(value)) {
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
            {/* The only empty value */}
            <SelectItem value="">All Categories</SelectItem>
            {filteredCategories
              .filter((cat) => typeof cat === "string" && cat.length > 0 && cat !== "")
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
