
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
        .filter((cat): cat is string => typeof cat === "string" && cat.length > 0)
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
      if (cat === "") {
        // eslint-disable-next-line no-console
        console.error(
          "[WishlistCategoryFilter] Detected empty string category! This should never happen. Index:",
          i
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
            {/* Only ONE clear/placeholder item */}
            <SelectItem value="">All Categories</SelectItem>
            {filteredCategories
              .filter((cat) => typeof cat === "string" && cat.trim() !== "")
              .map((cat, i) => (
                // Always guarantee value is non-empty string!
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

