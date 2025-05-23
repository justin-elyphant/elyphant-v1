
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
  // Clean up: filter out any empty, whitespace, or non-string values up-front
  const filteredCategories = React.useMemo(() => {
    if (!Array.isArray(selectableCategories)) return [];
    return selectableCategories
      .map(cat => (typeof cat === "string" ? cat.trim() : ""))
      .filter(
        (cat): cat is string =>
          typeof cat === "string" && cat.length > 0
      )
      .filter((cat, idx, arr) => arr.indexOf(cat) === idx); // dedupe
  }, [selectableCategories]);

  // DEV: runtime warning if any bad categories sneak through
  if (process.env.NODE_ENV === "development") {
    if (
      Array.isArray(selectableCategories) &&
      selectableCategories.some(cat => typeof cat !== "string" || cat.trim().length === 0)
    ) {
      // eslint-disable-next-line no-console
      console.error("[WishlistCategoryFilter][DEV] Detected invalid category in selectableCategories:", selectableCategories);
    }
    if (filteredCategories.some(cat => !cat || typeof cat !== "string" || cat.trim().length === 0)) {
      // eslint-disable-next-line no-console
      console.error("[WishlistCategoryFilter][DEV] Invalid value found in filteredCategories:", filteredCategories);
    }
  }

  // Current value for <Select />
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
            {/* Only the all-categories option uses value="" */}
            <SelectItem value="">All Categories</SelectItem>
            {filteredCategories
              .filter(cat => !!cat && cat !== "") // Never pass empty string to value!
              .map((cat, i) => (
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
