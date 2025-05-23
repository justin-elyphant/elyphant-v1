
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getValidCategories, logInvalidCategories } from "./utils/validCategoryUtils";

// Util: Remove duplicates, empty/whitespace, trim
function getStrictValidCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  return Array.from(
    new Set(
      categories
        .map((cat) => (typeof cat === "string" ? cat.trim() : ""))
        .filter((cat) => typeof cat === "string" && cat.length > 0 && cat !== "")
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
  // PREP: Strong filter so nothing empty or whitespace gets through
  const filteredCategories = React.useMemo(
    () => getStrictValidCategories(selectableCategories),
    [selectableCategories]
  );

  // Defensive dev logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Log any invalid category survivors
      filteredCategories.forEach((cat, idx) => {
        if (typeof cat !== "string" || cat.trim().length === 0 || cat === "") {
          // eslint-disable-next-line no-console
          console.error(`[WishlistCategoryFilter][DEV] Invalid category survived to render: "${cat}" at idx ${idx}`);
        }
      });
    }
  }, [filteredCategories]);

  // Don't render Select at all if nothing valid
  if (!filteredCategories.length) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[WishlistCategoryFilter][DEV] No valid categories to render Select.");
    }
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
            {/* DO NOT change "All Categories" below—needed for clearing */}
            <SelectItem value="">All Categories</SelectItem>
            {
              // FINAL GUARD: Never render empty-string category
              filteredCategories
                .filter((cat) => typeof cat === "string" && cat.trim().length > 0 && cat !== "")
                .map((cat, i) => (
                  <SelectItem key={cat + "-" + i} value={cat}>
                    {cat}
                  </SelectItem>
                ))
            }
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
