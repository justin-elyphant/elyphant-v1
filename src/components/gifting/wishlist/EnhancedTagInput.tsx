import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Sparkles, Tag, TrendingUp } from "lucide-react";
import { tagIntelligenceService, TagSuggestion, TAG_CATEGORIES } from "@/services/wishlist/TagIntelligenceService";
import { cn } from "@/lib/utils";

interface EnhancedTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  wishlistTitle?: string;
  wishlistDescription?: string;
  category?: string;
  showSuggestions?: boolean;
}

const EnhancedTagInput = ({
  tags,
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
  disabled = false,
  wishlistTitle = "",
  wishlistDescription = "",
  category,
  showSuggestions = true
}: EnhancedTagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showSuggestionsPopover, setShowSuggestionsPopover] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Generate smart suggestions based on wishlist context
  const smartSuggestions = useMemo(() => {
    if (!showSuggestions) return [];
    
    return tagIntelligenceService.generateTagSuggestions(
      wishlistTitle,
      wishlistDescription,
      category,
      tags
    );
  }, [wishlistTitle, wishlistDescription, category, tags, showSuggestions]);

  // Get categorized tags for quick selection
  const categorizedTags = useMemo(() => {
    const allCategories = tagIntelligenceService.getAllTagsByCategory();
    const result: Record<string, string[]> = {};
    
    Object.entries(allCategories).forEach(([categoryName, categoryTags]) => {
      result[categoryName] = categoryTags.filter(tag => !tags.includes(tag));
    });
    
    return result;
  }, [tags]);

  // Filter available tags by selected category
  const filteredCategoryTags = useMemo(() => {
    if (!selectedCategory) return [];
    return categorizedTags[selectedCategory] || [];
  }, [selectedCategory, categorizedTags]);

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
      onChange([...tags, normalizedTag]);
    }
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
    
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const applySuggestion = (suggestion: TagSuggestion) => {
    addTag(suggestion.tag);
  };

  const applyQuickTag = (tag: string) => {
    addTag(tag);
  };

  return (
    <div className="space-y-3">
      {/* Main tag input area */}
      <div className={cn(
        "flex flex-wrap items-center gap-2 p-3 border rounded-lg min-h-[48px]",
        disabled ? "bg-muted cursor-not-allowed" : "bg-background cursor-text"
      )}>
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
          >
            <Tag className="h-3 w-3" />
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-muted rounded-full p-0.5 ml-1"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            )}
          </Badge>
        ))}
        
        {tags.length < maxTags && !disabled && (
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="border-none p-0 h-auto min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        )}
        
        {tags.length === maxTags && (
          <span className="text-xs text-muted-foreground">
            Maximum {maxTags} tags reached
          </span>
        )}
      </div>

      {/* Smart suggestions */}
      {showSuggestions && smartSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Smart suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.slice(0, 4).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applySuggestion(suggestion)}
                className="h-7 px-2 text-xs"
                disabled={disabled}
              >
                <span>{suggestion.tag}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Category-based quick tags */}
      {showSuggestions && (
        <Popover open={showSuggestionsPopover} onOpenChange={setShowSuggestionsPopover}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              disabled={disabled}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Browse tag categories
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4">
              <h4 className="font-medium mb-3">Tag Categories</h4>
              
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1 mb-3">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
                {Object.keys(categorizedTags).map((categoryName) => (
                  <Button
                    key={categoryName}
                    variant={selectedCategory === categoryName ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(categoryName)}
                    className="h-7 px-2 text-xs capitalize"
                  >
                    {categoryName}
                  </Button>
                ))}
              </div>
              
              {/* Category tags */}
              <div className="max-h-32 overflow-y-auto">
                {selectedCategory ? (
                  <div className="flex flex-wrap gap-1">
                    {filteredCategoryTags.slice(0, 20).map((tag) => (
                      <Button
                        key={tag}
                        variant="ghost"
                        size="sm"
                        onClick={() => applyQuickTag(tag)}
                        className="h-6 px-2 text-xs justify-start"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(categorizedTags).map(([categoryName, categoryTags]) => (
                      <div key={categoryName}>
                        <h5 className="text-xs font-medium text-muted-foreground capitalize mb-1">
                          {categoryName}
                        </h5>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {categoryTags.slice(0, 6).map((tag) => (
                            <Button
                              key={tag}
                              variant="ghost"
                              size="sm"
                              onClick={() => applyQuickTag(tag)}
                              className="h-6 px-2 text-xs"
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default EnhancedTagInput;