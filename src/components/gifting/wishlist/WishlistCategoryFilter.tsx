
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

// Ensure only strictly valid, non-empty, trimmed unique strings
function getStrictValidCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  const arr = Array.from(
    new Set(
      categories
        .filter((cat): cat is string => typeof cat === "string")
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0)
    )
  );
  // DEV: log if invalid value slipped through
  if (process.env.NODE_ENV === "development") {
    arr.forEach((cat, idx) => {
      if (!cat || cat === "" || typeof cat !== "string" || cat.trim().length === 0) {
        // eslint-disable-next-line no-console
        console.error("Invalid category produced for SelectItem:", cat, idx);
      }
    });
  }
  return arr;
}

const WishlistCategoryFilter: React.FC<WishlistCategoryFilterProps> = ({
  selectableCategories,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}) => {
  // Use stricter util
  const filteredCategories = React.useMemo(() => getStrictValidCategories(selectableCategories), [selectableCategories]);

  // DEV LOGGING: Also check selectableCategories
  if (
    process.env.NODE_ENV === "development" &&
    Array.isArray(selectableCategories)
  ) {
    selectableCategories.forEach((cat, i) => {
      if (
        typeof cat !== "string" ||
        cat.trim().length === 0
      ) {
        // eslint-disable-next-line no-console
        console.error(`[WishlistCategoryFilter][DEV] Invalid category in selectableCategories at index ${i}:`, cat);
      }
    });
  }

  // Select's value logic - only non-empty string matches allowed
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
            {/* All Categories uses value="" */}
            <SelectItem value="">All Categories</SelectItem>
            {filteredCategories
              .filter(cat => cat && cat.trim().length > 0)
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
