
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

const WishlistCategoryFilter: React.FC<WishlistCategoryFilterProps> = ({
  selectableCategories,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}) => {
  // Only valid string categories (non-empty, trimmed)
  const validCategories = React.useMemo(() => {
    return Array.isArray(selectableCategories)
      ? selectableCategories.filter(
          (cat): cat is string =>
            typeof cat === "string" && !!cat.trim() && cat !== ""
        )
      : [];
  }, [selectableCategories]);

  // Remove duplicates
  const dedupedCategories = React.useMemo(() => {
    return Array.from(new Set(validCategories));
  }, [validCategories]);

  // Current value for <Select />
  const currentValue =
    typeof categoryFilter === "string" &&
    dedupedCategories.includes(categoryFilter) &&
    categoryFilter.trim().length > 0
      ? categoryFilter
      : "";

  // Developer-only logging for debugging
  if (process.env.NODE_ENV === "development") {
    dedupedCategories.forEach((cat, idx) => {
      if (!(typeof cat === "string" && !!cat.trim() && cat !== "")) {
        // eslint-disable-next-line no-console
        console.error("[WishlistCategoryFilter] Invalid category value in dedupedCategories:", {
          idx,
          cat,
        });
      }
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            if (!value || value === "" || !dedupedCategories.includes(value)) {
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
            {/* Only the all-categories option uses value="" */}
            <SelectItem value="">All Categories</SelectItem>
            {dedupedCategories
              // Filter out any empty string or whitespace-only category to prevent SelectItem with value=""
              .filter((cat) => typeof cat === "string" && !!cat.trim() && cat !== "")
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
