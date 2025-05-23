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

// Strong filter: dedupe, remove empty/whitespace, trim all, only valid strings
function getStrictValidCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  return Array.from(
    new Set(
      categories
        .map((cat) => (typeof cat === "string" ? cat.trim() : ""))
        .filter((cat) => typeof cat === "string" && cat.length > 0)
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
  // Only include non-empty, non-whitespace, trimmed values as categories
  const filteredCategories = React.useMemo(
    () => getStrictValidCategories(selectableCategories),
    [selectableCategories]
  );

  // DEV LOGGING
  if (process.env.NODE_ENV === "development") {
    if (Array.isArray(selectableCategories)) {
      selectableCategories.forEach((cat, i) => {
        if (typeof cat !== "string" || !cat.trim()) {
          // eslint-disable-next-line no-console
          console.error(`[WishlistCategoryFilter][DEV] Invalid category in selectableCategories at index ${i}:`, cat);
        }
      });
    }
    filteredCategories.forEach((cat, i) => {
      if (typeof cat !== "string" || !cat.trim()) {
        // eslint-disable-next-line no-console
        console.error(`[WishlistCategoryFilter][DEV] Invalid filtered category at index ${i}:`, cat);
      }
    });
  }

  // "" for All Categories, else actual value for filtering
  const currentValue =
    typeof categoryFilter === "string" &&
    filteredCategories.includes(categoryFilter) &&
    !!categoryFilter.trim()
      ? categoryFilter
      : "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            // "" triggers 'all categories'; only valid choices otherwise
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
            <SelectItem value="">All Categories</SelectItem>
            {filteredCategories.map((cat, i) =>
              // Never allow an empty value here
              typeof cat === "string" && cat.length > 0 ? (
                <SelectItem key={cat + "-" + i} value={cat}>
                  {cat}
                </SelectItem>
              ) : null
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
