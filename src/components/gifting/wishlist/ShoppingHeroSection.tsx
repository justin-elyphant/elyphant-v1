import React from "react";
import { Search, Plus, X, Home, Sparkles, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IOSSwitch } from "@/components/ui/ios-switch";
import IntegratedSearchSection from "@/components/marketplace/IntegratedSearchSection";

interface ShoppingHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categories: string[];
  viewMode?: 'hub' | 'home' | 'shopping';
  onClearFilters?: () => void;
  onCreateWishlist?: () => void;
  aiSearchEnabled?: boolean;
  onAISearchToggle?: (enabled: boolean) => void;
  onAISearch?: () => void;
  onRecentSearchClick?: (term: string) => void;
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
  onAISearch,
  onRecentSearchClick
}) => {
  return (
    <div className="relative overflow-hidden py-4 px-4 sm:px-6 lg:px-8">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-primary/5 to-pink-500/5" />
      
      <div className="relative max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Shop Wishlists
          </h1>
          {viewMode === 'shopping' && (
            <Badge variant="secondary" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              Shopping
            </Badge>
          )}
        </div>

        {/* Compact Search Bar with Inline AI Toggle */}
        <div className="space-y-2">
          <div className="relative max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none z-10 ${
                aiSearchEnabled ? 'text-purple-500' : 'text-muted-foreground'
              }`}>
                <Search className="h-4 w-4 transition-colors" />
                {aiSearchEnabled && (
                  <Sparkles className="h-3 w-3 animate-pulse" />
                )}
              </div>
              <Input
                placeholder={aiSearchEnabled ? "Ask AI for gift ideas..." : "Search products..."}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (aiSearchEnabled && searchQuery.trim()) {
                      onAISearch?.();
                    } else {
                      const el = document.getElementById('browse-products');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }}
                className={`pl-12 pr-24 h-11 text-base border-2 focus:border-primary shadow-sm transition-all ${
                  aiSearchEnabled ? 'ring-1 ring-purple-300 bg-purple-50/30' : ''
                }`}
              />
              {(searchQuery || selectedCategory) && onClearFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            
            {/* Inline AI Toggle */}
            {onAISearchToggle && (
              <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3">
                <Search className={`h-3.5 w-3.5 transition-colors ${!aiSearchEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <IOSSwitch
                  size="sm"
                  checked={aiSearchEnabled}
                  onCheckedChange={onAISearchToggle}
                  className="touch-manipulation"
                />
                <Bot className={`h-3.5 w-3.5 transition-colors ${aiSearchEnabled ? 'text-purple-500' : 'text-muted-foreground'}`} />
              </div>
            )}
          </div>
          
          {aiSearchEnabled && searchQuery.trim() && onAISearch && (
            <div className="text-center">
              <Button
                onClick={onAISearch}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-1.5 h-8"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Get AI Recommendations
              </Button>
            </div>
          )}
        </div>

        {/* Recent Searches - only show when no active search */}
        {!searchQuery && onRecentSearchClick && (
          <div className="-mt-1">
            <IntegratedSearchSection onRecentSearchClick={onRecentSearchClick} />
          </div>
        )}

        {/* Compact Category Quick Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center max-w-3xl mx-auto">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-xs"
              onClick={() => onCategorySelect(null)}
            >
              All
            </Badge>
            {categories.slice(0, 5).map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-xs"
                onClick={() => onCategorySelect(category)}
              >
                {category}
              </Badge>
            ))}
            {categories.length > 5 && (
              <Badge
                variant="outline"
                className="cursor-pointer px-3 py-1 text-xs"
              >
                +{categories.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingHeroSection;
