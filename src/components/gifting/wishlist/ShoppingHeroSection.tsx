import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ShoppingHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categories: string[];
}

const ShoppingHeroSection: React.FC<ShoppingHeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categories
}) => {
  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Shop Your Wishlists
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse products and add to any wishlist in one click
          </p>
        </div>

        {/* Large Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-14 text-lg border-2 focus:border-primary shadow-lg"
          />
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
