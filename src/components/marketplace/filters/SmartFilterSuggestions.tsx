import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import { SearchContext, DynamicFilterState } from "@/types/filters";

interface SmartFilterSuggestionsProps {
  searchContext: SearchContext;
  onApplySuggestion: (filters: Partial<DynamicFilterState>) => void;
  currentFilters: DynamicFilterState;
}

export const SmartFilterSuggestions: React.FC<SmartFilterSuggestionsProps> = ({
  searchContext,
  onApplySuggestion,
  currentFilters
}) => {
  const generateSuggestions = () => {
    const suggestions: Array<{
      label: string;
      filters: Partial<DynamicFilterState>;
      reason: string;
      icon?: React.ReactNode;
    }> = [];

    // Gender-based suggestions
    if (searchContext.gender && !currentFilters.selectedDemographics.includes(searchContext.gender)) {
      suggestions.push({
        label: `${searchContext.gender.charAt(0).toUpperCase() + searchContext.gender.slice(1)}'s Items`,
        filters: {
          selectedDemographics: [...currentFilters.selectedDemographics, searchContext.gender]
        },
        reason: "Based on your search terms",
        icon: <Sparkles className="h-3 w-3" />
      });
    }

    // Age group suggestions
    if (searchContext.ageGroup && !currentFilters.selectedDemographics.includes(searchContext.ageGroup)) {
      suggestions.push({
        label: `For ${searchContext.ageGroup}`,
        filters: {
          selectedDemographics: [...currentFilters.selectedDemographics, searchContext.ageGroup]
        },
        reason: "Age-appropriate items",
        icon: <Sparkles className="h-3 w-3" />
      });
    }

    // Occasion-based suggestions
    if (searchContext.occasion && !currentFilters.selectedOccasions.includes(searchContext.occasion)) {
      const occasionLabel = searchContext.occasion.replace('-', ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      suggestions.push({
        label: `${occasionLabel} Gifts`,
        filters: {
          selectedOccasions: [...currentFilters.selectedOccasions, searchContext.occasion]
        },
        reason: "Perfect for the occasion",
        icon: <Sparkles className="h-3 w-3" />
      });
    }

    // Gift context suggestions
    if (searchContext.isGiftContext) {
      // Suggest popular gift price ranges
      if (currentFilters.priceRange[0] === 0 && currentFilters.priceRange[1] === 1000) {
        suggestions.push({
          label: "Popular Gift Range ($25-$100)",
          filters: {
            priceRange: [25, 100] as [number, number]
          },
          reason: "Most popular gift price range",
          icon: <TrendingUp className="h-3 w-3" />
        });
      }

      // Suggest free shipping for gifts
      if (!currentFilters.freeShipping) {
        suggestions.push({
          label: "Free Shipping",
          filters: {
            freeShipping: true
          },
          reason: "Great for gift deliveries",
          icon: <Sparkles className="h-3 w-3" />
        });
      }
    }

    // Product category suggestions based on search context
    if (searchContext.productCategory && !currentFilters.selectedCategories.includes(searchContext.productCategory)) {
      suggestions.push({
        label: searchContext.productCategory,
        filters: {
          selectedCategories: [...currentFilters.selectedCategories, searchContext.productCategory]
        },
        reason: "Matches your search",
        icon: <Sparkles className="h-3 w-3" />
      });
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const suggestions = generateSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-primary">Smart Suggestions</h3>
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {suggestion.icon}
                <span className="text-sm font-medium">{suggestion.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplySuggestion(suggestion.filters)}
              className="ml-2 h-8 px-3 text-xs"
            >
              Apply
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};