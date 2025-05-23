
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getValidCategories, logInvalidCategories } from "./utils/validCategoryUtils";

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
  // Only include non-empty, non-whitespace, trimmed values as categories
  const filteredCategories = React.useMemo(
    () => getStrictValidCategories(selectableCategories),
    [selectableCategories]
  );

  // Defensive: avoid rendering if no valid categories
  if (!filteredCategories.length) {
    if (process.env.NODE_ENV === "development") {
      console.error("[WishlistCategoryFilter][DEV] No valid filteredCategories, nothing to render", { selectableCategories, filteredCategories });
    }
    return null;
  }

  // Extra logging to catch any possible invalid categories
  if (process.env.NODE_ENV === "development") {
    filteredCategories.forEach((cat, i) => {
      if (typeof cat !== "string" || !cat.trim() || cat === "") {
        console.error(`[WishlistCategoryFilter][DEV] BAD: About to render invalid filtered category at index ${i}:`, `cat="${cat}"`);
      }
    });
  }

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
            {filteredCategories.map((cat, i) => {
              // Only allow non-empty, non-whitespace strings as value
              if (typeof cat === "string" && cat.trim().length > 0) {
                return (
                  <SelectItem key={cat + "-" + i} value={cat}>
                    {cat}
                  </SelectItem>
                );
              } else {
                if (process.env.NODE_ENV === "development") {
                  console.error(`[WishlistCategoryFilter][DEV] SKIPPING invalid category:`, cat);
                }
                return null;
              }
            })}
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
