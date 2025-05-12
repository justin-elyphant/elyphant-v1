
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X, Filter, SlidersHorizontal, Search } from "lucide-react";

interface WishlistFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  showMobile?: boolean;
  onToggleMobile?: () => void;
}

// Define the constant categories outside the component
const CATEGORIES = [
  { value: "birthday", label: "Birthday" },
  { value: "holiday", label: "Holiday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "wedding", label: "Wedding" },
  { value: "baby", label: "Baby" },
  { value: "personal", label: "Personal" },
  { value: "shopping", label: "Shopping" },
  { value: "gift-ideas", label: "Gift Ideas" },
  { value: "other", label: "Other" },
];

const WishlistFilters = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
  showMobile = true,
  onToggleMobile
}: WishlistFiltersProps) => {
  // Combine built-in categories with user's custom categories
  const allCategories = React.useMemo(() => {
    const categoryValues = CATEGORIES.map(c => c.value);
    
    // Add any custom categories that aren't in our predefined list
    const customCategories = categories
      .filter(category => !categoryValues.includes(category))
      .map(category => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1)
      }));
    
    return [...CATEGORIES, ...customCategories];
  }, [categories]);
  
  // Check if any filters are active
  const hasActiveFilters = selectedCategory || searchQuery;
  
  return (
    <div className="space-y-4">
      {/* Mobile Toggle Button (visible only on small screens) */}
      <div className="sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMobile}
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {(selectedCategory ? 1 : 0) + (searchQuery ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Filter Content (responsive) */}
      <div className={`space-y-4 ${!showMobile ? "hidden sm:block" : ""}`}>
        {/* Search Input */}
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search Wishlists
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or description..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Filter by Category
          </label>
          <Select
            value={selectedCategory || ""}
            onValueChange={(value) => onCategoryChange(value || null)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" /> Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default WishlistFilters;
