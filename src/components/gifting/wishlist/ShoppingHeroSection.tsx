import React from "react";
import { Search, Plus, X, Home, Sparkles, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IOSSwitch } from "@/components/ui/ios-switch";

interface ShoppingHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categories: string[];
  viewMode?: 'home' | 'shopping';
  onClearFilters?: () => void;
  onCreateWishlist?: () => void;
  aiSearchEnabled?: boolean;
  onAISearchToggle?: (enabled: boolean) => void;
  onAISearch?: () => void;
}

const ShoppingHeroSection: React.FC<ShoppingHeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categories,
  viewMode = 'home',
  onClearFilters,
  onCreateWishlist,
  aiSearchEnabled = false,
  onAISearchToggle,
  onAISearch
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

        {/* Large Search Bar with Clear Button and AI Toggle */}
        <div className="space-y-3">
          <div className="relative max-w-2xl mx-auto">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10 ${
              aiSearchEnabled ? 'text-purple-500' : 'text-muted-foreground'
            }`}>
              <Search className="h-5 w-5 transition-colors" />
              {aiSearchEnabled && (
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              )}
            </div>
            <Input
              placeholder={aiSearchEnabled ? "Ask AI to find the perfect gift..." : "What are you looking for?"}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (aiSearchEnabled && searchQuery.trim()) {
                    onAISearch?.();
                  } else {
                    // Scroll to results section for standard search
                    const el = document.getElementById('browse-products');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }}
              className={`pl-16 pr-40 h-14 text-lg border-2 focus:border-primary shadow-lg transition-all ${
                aiSearchEnabled ? 'ring-2 ring-purple-300 bg-gradient-to-r from-purple-50/50 to-indigo-50/50' : ''
              }`}
            />
            {/* Clear button */}
            {(searchQuery || selectedCategory) && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="absolute right-24 top-1/2 -translate-y-1/2 gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
            {/* Explicit Search button for standard mode */}
            {!aiSearchEnabled && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('browse-products');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            )}
          </div>

          {/* AI Search Toggle */}
          {onAISearchToggle && (
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm">
                <Search className={`h-3.5 w-3.5 transition-colors ${!aiSearchEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium text-muted-foreground">Standard</span>
                <IOSSwitch
                  size="sm"
                  checked={aiSearchEnabled}
                  onCheckedChange={onAISearchToggle}
                  className="touch-manipulation"
                />
                <span className="text-sm font-medium text-muted-foreground">AI Search</span>
                <Bot className={`h-3.5 w-3.5 transition-colors ${aiSearchEnabled ? 'text-purple-500' : 'text-muted-foreground'}`} />
                {aiSearchEnabled && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    Powered by Nicole
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {aiSearchEnabled && searchQuery.trim() && onAISearch && (
            <div className="text-center">
              <Button
                onClick={onAISearch}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Get AI-Powered Recommendations
              </Button>
            </div>
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
