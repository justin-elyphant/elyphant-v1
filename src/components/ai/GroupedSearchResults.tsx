import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import type { GroupedSearchResults, CategoryResults } from "@/services/ai/multiCategorySearchService";
import { ConversationEnhancementService } from "@/services/ai/conversationEnhancementService";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductGrid from "@/components/marketplace/product-grid/ProductGrid";
import { useProductInteractions } from "@/components/marketplace/product-grid/hooks/useProductInteractions";

interface GroupedSearchResultsProps {
  groupedResults: GroupedSearchResults;
  onProductSelect?: (product: Product) => void;
  onCategoryExpand?: (categoryName: string) => void;
  onFollowUpRequest?: (message: string) => void;
}

const GroupedSearchResultsComponent: React.FC<GroupedSearchResultsProps> = ({
  groupedResults,
  onProductSelect,
  onCategoryExpand,
  onFollowUpRequest
}) => {
  const isMobile = useIsMobile();

  if (!groupedResults || groupedResults.categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Search Metrics */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Gift Ideas by Category
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Found {groupedResults.totalResults} products across {groupedResults.categories.length} categories
        </p>
        {groupedResults.searchMetrics && (
          <p className="text-xs text-gray-500 mt-1">
            Search completed in {(groupedResults.searchMetrics.totalSearchTime / 1000).toFixed(2)}s • 
            {groupedResults.searchMetrics.successfulSearches} successful searches
          </p>
        )}
      </div>

      {/* Category Results using existing ProductGrid components */}
      {groupedResults.categories.map((category) => (
        <CategorySection
          key={category.categoryName}
          category={category}
          onProductSelect={onProductSelect}
          onCategoryExpand={onCategoryExpand}
          onFollowUpRequest={onFollowUpRequest}
          isMobile={isMobile}
        />
      ))}

      {/* Cross-Category Suggestions */}
      {groupedResults.categories.length > 1 && (
        <CrossCategorySuggestionsSection 
          categories={groupedResults.categories}
          onFollowUpRequest={onFollowUpRequest}
        />
      )}
    </div>
  );
};

interface CategorySectionProps {
  category: CategoryResults;
  onProductSelect?: (product: Product) => void;
  onCategoryExpand?: (categoryName: string) => void;
  onFollowUpRequest?: (message: string) => void;
  isMobile: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onProductSelect,
  onCategoryExpand,
  onFollowUpRequest,
  isMobile
}) => {
  // Use existing product interactions hook for consistency
  const { renderProductCard } = useProductInteractions(
    category.products,
    isMobile ? "grid" : "grid",
    (productId: string) => {
      const product = category.products.find(p => p.product_id === productId || p.id === productId);
      if (product && onProductSelect) {
        onProductSelect(product);
      }
    }
  );

  const handleSeeMore = () => {
    if (onCategoryExpand) {
      onCategoryExpand(category.categoryName);
    }
  };

  const handleShowMoreItems = () => {
    const categoryDisplayName = generateSectionTitle(category.categoryName, category.displayName);
    const followUpMessage = `Show me more ${categoryDisplayName.toLowerCase()} items`;
    
    // Track the interaction
    ConversationEnhancementService.trackCategoryInteraction({
      categoryName: category.categoryName,
      action: 'requested_more',
      timestamp: new Date(),
      products: category.products
    });

    if (onFollowUpRequest) {
      onFollowUpRequest(followUpMessage);
    }
  };

  // Generate dynamic section title
  const generateSectionTitle = (categoryName: string, displayName: string): string => {
    const titleMap: Record<string, string> = {
      'kitchen': 'Cooking Essentials',
      'athletic-wear': 'Athletic Favorites',
      'fitness': 'Fitness Gear',
      'travel': 'Travel Essentials',
      'electronics': 'Tech Favorites',
      'books': 'Reading Corner',
      'art-supplies': 'Creative Tools',
      'outdoor-gear': 'Outdoor Adventures'
    };

    // Check if it's a brand-based category
    if (displayName.toLowerCase().includes('lululemon')) return 'Lululemon Favorites';
    if (displayName.toLowerCase().includes('apple')) return 'Apple Essentials';
    if (displayName.toLowerCase().includes('nike')) return 'Nike Collection';
    if (displayName.toLowerCase().includes('patagonia')) return 'Patagonia Gear';
    if (displayName.toLowerCase().includes('vitamix')) return 'Vitamix Kitchen';
    if (displayName.toLowerCase().includes('kitchenaid')) return 'KitchenAid Collection';

    return titleMap[categoryName] || displayName;
  };

  const sectionTitle = generateSectionTitle(category.categoryName, category.displayName);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            {sectionTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {category.resultCount} items
            </Badge>
            {category.relevanceScore && (
              <Badge 
                variant="outline" 
                className="text-xs text-green-600 border-green-200"
              >
                {Math.round(category.relevanceScore)}% match
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Search: "{category.searchQuery}"
          </p>
          {category.searchTime && (
            <p className="text-xs text-gray-400">
              {category.searchTime}ms
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Use existing ProductGrid component for consistency */}
        <ProductGrid
          products={category.products}
          viewMode="grid"
          renderProductCard={renderProductCard}
          showGroupedSections={false}
          onProductView={(productId: string) => {
            const product = category.products.find(p => p.product_id === productId || p.id === productId);
            if (product && onProductSelect) {
              onProductSelect(product);
            }
          }}
        />
        
        {/* Enhanced Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {category.products.length >= 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowMoreItems}
              className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
            >
              Show more {sectionTitle.toLowerCase()}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSeeMore}
            className="flex-1 text-gray-600 hover:text-gray-700"
          >
            View all in marketplace →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface CrossCategorySuggestionsProps {
  categories: CategoryResults[];
  onFollowUpRequest?: (message: string) => void;
}

const CrossCategorySuggestionsSection: React.FC<CrossCategorySuggestionsProps> = ({
  categories,
  onFollowUpRequest
}) => {
  // Generate cross-category suggestions based on current categories
  const suggestions = React.useMemo(() => {
    const allSuggestions: any[] = [];
    
    categories.forEach(category => {
      const crossSuggestions = ConversationEnhancementService.generateCrossCategorySuggestions(
        category.categoryName,
        { interests: [], detectedBrands: [], categoryMappings: [] } // Simplified context
      );
      allSuggestions.push(...crossSuggestions);
    });

    // Remove duplicates and get top 2
    const uniqueSuggestions = allSuggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.fromCategory === suggestion.fromCategory && s.toCategory === suggestion.toCategory)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);

    return uniqueSuggestions;
  }, [categories]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-purple-900 flex items-center gap-2">
          <span className="text-purple-500">✨</span>
          You might also like
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Since you're interested in <span className="font-medium text-purple-700">{suggestion.fromCategory}</span>, 
                  you might enjoy <span className="font-medium text-purple-700">{suggestion.toCategory}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{suggestion.reasoning}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onFollowUpRequest) {
                    onFollowUpRequest(`Show me ${suggestion.toCategory} items that would work for ${suggestion.fromCategory} enthusiasts`);
                  }
                }}
                className="ml-3 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Explore
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupedSearchResultsComponent;
