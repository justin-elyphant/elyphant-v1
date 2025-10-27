import React from "react";
import { Search, Plus, X, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ShoppingHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categories: string[];
  viewMode?: 'home' | 'shopping';
  onClearFilters?: () => void;
  onCreateWishlist?: () => void;
}

const ShoppingHeroSection: React.FC<ShoppingHeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categories,
  viewMode = 'home',
  onClearFilters,
  onCreateWishlist
}) => {
  return (
    <div className="relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8">
      {/* Vibrant gradient background with purple/magenta tones matching logo */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-primary/5 to-pink-500/10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-background/80 to-transparent" />
      
      <div className="relative max-w-4xl mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Shop Your Wishlists
            </h1>
            {viewMode === 'shopping' && (
              <Badge variant="secondary" className="text-xs">
                <Search className="h-3 w-3 mr-1" />
                Shopping Mode
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground">
            {viewMode === 'home' 
              ? 'Browse products and add to any wishlist in one click'
              : 'Discover products matching your search'
            }
          </p>
        </div>

        {/* Large Search Bar with Clear Button */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-24 h-14 text-lg border-2 focus:border-primary shadow-lg"
          />
          {(searchQuery || selectedCategory) && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="absolute right-2 top-1/2 -translate-y-1/2 gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Category Quick Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => onCategorySelect(null)}
            >
              All
            </Badge>
            {categories.slice(0, 8).map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => onCategorySelect(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingHeroSection;
