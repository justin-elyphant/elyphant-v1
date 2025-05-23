
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getValidCategories, logInvalidCategories } from "./utils/validCategoryUtils";

/**
 * Props for WishlistCategoryFilter.
 */
type WishlistCategoryFilterProps = {
  /**
   * Array of categories (already filtered and trimmed) - must not include empty strings.
   */
  selectableCategories: string[];
  categoryFilter: string | null | undefined;
  onCategoryFilterChange: (category: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
};

/**
 * Filter selects: no empty value except for "All Categories"
 */
const WishlistCategoryFilter: React.FC<WishlistCategoryFilterProps> = ({
  selectableCategories,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}) => {
  // Use new utility to filter and memoize categories
  const validRenderedCategories = React.useMemo(
    () => getValidCategories(selectableCategories),
    [selectableCategories]
  );

  // Extra dev logging: ensure we don't have any invalid categories
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      validRenderedCategories.forEach((cat, i) => {
        if (typeof cat !== "string" || cat.trim().length === 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[WishlistCategoryFilter] Invalid category detected! Index: ${i}, Value: "${cat}"`
          );
        }
      });
    }
    logInvalidCategories(selectableCategories, "WishlistCategoryFilter selectableCategories");
    logInvalidCategories(validRenderedCategories, "WishlistCategoryFilter validRenderedCategories");
    // eslint-disable-next-line no-console
    console.log("[WishlistCategoryFilter] Rendering categories:", validRenderedCategories);
  }, [selectableCategories, validRenderedCategories]);

  // Defensive: only allow "" for All Categories as value
  const currentValue =
    typeof categoryFilter === "string" && validRenderedCategories.includes(categoryFilter)
      ? categoryFilter
      : "";

  // Strongest filter: absolutely no empty, null, or whitespace-only strings
  const filteredCategories = React.useMemo(
    () =>
      validRenderedCategories.filter(
        (cat) =>
          typeof cat === "string" &&
          cat.trim().length > 0 &&
          cat !== "" &&
          cat !== null
      ),
    [validRenderedCategories]
  );

  // Extra log: fail hard if filteredCategories has an invalid value
  React.useEffect(() => {
    filteredCategories.forEach((cat, i) => {
      if (typeof cat !== "string" || cat === "" || cat.trim().length === 0) {
        // eslint-disable-next-line no-console
        console.error("[WishlistCategoryFilter] About to render invalid category in <SelectItem>: ", i, cat);
      }
    });
  }, [filteredCategories]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            if (!value || !filteredCategories.includes(value) || value === "") {
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
              // Defensive: never render an invalid category!
              if (typeof cat !== "string" || cat.trim().length === 0 || cat === "") {
                if (process.env.NODE_ENV === "development") {
                  // eslint-disable-next-line no-console
                  console.error(
                    "[WishlistCategoryFilter] Skipping rendering <SelectItem> with empty or invalid value! Index:",
                    i,
                    "Value:",
                    cat
                  );
                }
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

