
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

  // --- STRICTEST filter: nothing falsy, no whitespace, no empty string
  const filteredCategories = React.useMemo(() => {
    return dedupedCategories.filter(
      (cat): cat is string => !!cat && typeof cat === "string" && cat.trim().length > 0 && cat !== ""
    );
  }, [dedupedCategories]);

  // Development logging: sanity checks for any bad categories
  if (process.env.NODE_ENV === "development") {
    dedupedCategories.forEach((cat, idx) => {
      if (!(!!cat && typeof cat === "string" && cat.trim().length > 0 && cat !== "")) {
        // eslint-disable-next-line no-console
        console.error("[WishlistCategoryFilter][DEV] Bad category won't render as SelectItem:", { idx, cat });
      }
    });
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
            {/* Only the all-categories option has value="" */}
            <SelectItem value="">All Categories</SelectItem>
            {filteredCategories.map((cat, i) => (
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
