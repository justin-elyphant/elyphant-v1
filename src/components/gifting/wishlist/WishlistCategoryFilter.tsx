
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getValidCategories, logInvalidCategories } from "./utils/validCategoryUtils";

/**
 * Props for WishlistCategoryFilter.
 */
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

  // Strict: prepare only truly valid, non-empty, trimmed category values for rendering
  const filteredCategories = React.useMemo(
    () =>
      validRenderedCategories.filter(
        (cat) => typeof cat === "string" && cat.trim().length > 0 && cat !== ""
      ),
    [validRenderedCategories]
  );

  // Extra strict guard: log if any bad entries about to render
  React.useEffect(() => {
    filteredCategories.forEach((cat, i) => {
      if (
        typeof cat !== "string" ||
        cat.trim().length === 0 ||
        cat === ""
      ) {
        // eslint-disable-next-line no-console
        console.error(
          "[WishlistCategoryFilter] About to render <SelectItem> with INVALID value! Index:",
          i,
          "Value:",
          cat
        );
      }
    });
  }, [filteredCategories]);

  // --- FINAL IRONCLAD FILTER ---
  // Absolutely never let an empty, whitespace, null, or undefined value render as a SelectItem (only allowed for All Categories);
  const finalCategoryItems = React.useMemo(
    () =>
      filteredCategories.filter(
        (cat): cat is string =>
          typeof cat === "string" &&
          cat.trim().length > 0 &&
          cat !== "" &&
          cat !== null &&
          cat !== undefined
      ),
    [filteredCategories]
  );

  // Extra runtime validation: only non-empty, non-null/undefined strings allowed!
  // If a bad value slips through, skip it and log the error.
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="w-full sm:w-1/3">
        <Select
          value={currentValue}
          onValueChange={(value) => {
            // Only "" is allowed for All Categories
            if (!value || value === "" || !finalCategoryItems.includes(value)) {
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
            {/* Only this entry can use "" */}
            <SelectItem value="">All Categories</SelectItem>
            {/* Only render non-empty, trimmed, ironclad guaranteed string categories */}
            {finalCategoryItems.map((cat, i) => {
              if (
                typeof cat !== "string" ||
                cat.trim().length === 0 ||
                cat === "" ||
                cat === null ||
                cat === undefined
              ) {
                // Defensive: should never run, but just in case, don't render and log
                if (process.env.NODE_ENV !== "production") {
                  // eslint-disable-next-line no-console
                  console.error(
                    "[WishlistCategoryFilter] Refused to render <SelectItem> with invalid value! Index:",
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
