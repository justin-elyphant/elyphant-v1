
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
  // Always filter categories up front, but ONLY render after final validation
  const rawCategories = React.useMemo(
    () => getValidCategories(selectableCategories),
    [selectableCategories]
  );

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      logInvalidCategories(selectableCategories, "WishlistCategoryFilter selectableCategories");
      logInvalidCategories(rawCategories, "WishlistCategoryFilter rawCategories");
      // eslint-disable-next-line no-console
      console.log("[WishlistCategoryFilter] Rendering categories:", rawCategories);
    }
  }, [selectableCategories, rawCategories]);

  // Compute selected value - only allow "" for All Categories
  const currentValue =
    typeof categoryFilter === "string" && rawCategories.includes(categoryFilter) && categoryFilter !== ""
      ? categoryFilter
      : "";

  // FINAL GUARD: Filter categories at render time for <SelectItem />, never include ""
  function getFilteredCategoriesForSelect(categories: unknown[]): string[] {
    const filtered: string[] = [];
    categories.forEach((cat, idx) => {
      if (
        typeof cat === "string" &&
        cat.trim().length > 0 &&
        cat !== "" &&
        cat !== undefined &&
        cat !== null
      ) {
        filtered.push(cat);
      } else {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error(
            `[WishlistCategoryFilter] Invalid category excluded from <SelectItem /> at index ${idx}:`,
            cat
          );
        }
      }
    });
    return filtered;
  }

  // Use only strictly valid, non-empty categories for select items
  const finalCategoryItems = React.useMemo(
    () => getFilteredCategoriesForSelect(rawCategories),
    [rawCategories]
  );

  // FINAL GUARD: DEV-only log if any invalid value slipped through before rendering
  if (process.env.NODE_ENV === "development") {
    finalCategoryItems.forEach((cat, idx) => {
      if (typeof cat !== "string" || cat.trim().length === 0 || cat === "") {
        // eslint-disable-next-line no-console
        console.error(`[WishlistCategoryFilter] <SelectItem /> about to render with an invalid value (BUG):`, {
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
            {/* Only the 'All Categories' option gets value="" */}
            <SelectItem value="">All Categories</SelectItem>
            {finalCategoryItems.map((cat, i) =>
              cat !== "" ? (
                <SelectItem key={cat + "-" + i} value={cat}>
                  {cat}
                </SelectItem>
              ) : null // extra guard, never render if blank
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
