
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Utility: Filter out invalid/empty/whitespace-only categories safely
function getStrictValidCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  return Array.from(
    new Set(
      categories
        .map((cat) => (typeof cat === "string" ? cat.trim() : ""))
        .filter(
          (cat): cat is string =>
            typeof cat === "string" && cat.length > 0 && cat !== ""
        )
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
  // Final filter: absolutely no empty/whitespace category values!
  const filteredCategories = React.useMemo(
    () => getStrictValidCategories(selectableCategories),
    [selectableCategories]
  );

  // Debug: Warn if any empty string slips in
  React.useEffect(() => {
    filteredCategories.forEach((cat, i) => {
      if (cat === "" || typeof cat !== "string") {
        // eslint-disable-next-line no-console
        console.error(
          "[WishlistCategoryFilter] Detected empty or invalid category! This should never happen. Index:",
          i,
          "Value:",
          cat
        );
      }
    });
  }, [filteredCategories]);

  // Don't render Select if nothing valid
  if (!filteredCategories.length) {
    return null;
  }

  const currentValue =
    typeof categoryFilter === "string" &&
    filteredCategories.includes(categoryFilter) &&
    !!categoryFilter.trim()
      ? categoryFilter
      : "all_categories";

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            if (!value || value === "all_categories" || !filteredCategories.includes(value)) {
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
            <SelectItem value="all_categories">All Categories</SelectItem>
            {filteredCategories
              // FINAL FILTER: only use categories that are non-empty, trimmed, pure strings!
              .filter(
                (cat: string) => typeof cat === "string" && cat.trim().length > 0 && cat !== ""
              )
              .map((cat, i) => {
                if (cat === "") {
                  // Should never happen, debug log if so
                  // eslint-disable-next-line no-console
                  console.warn(
                    "[WishlistCategoryFilter] Skipping empty category value about to render.",
                    i,
                    cat
                  );
                  return null;
                }
                return (
                  <SelectItem key={cat + "-" + i} value={cat}>
                    {cat}
                  </SelectItem>
                );
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
