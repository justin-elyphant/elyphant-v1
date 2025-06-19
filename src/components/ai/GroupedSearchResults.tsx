
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/contexts/ProductContext";
import type { GroupedSearchResults, CategoryResults } from "@/services/ai/multiCategorySearchService";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductGrid from "@/components/marketplace/product-grid/ProductGrid";
import { useProductInteractions } from "@/components/marketplace/product-grid/hooks/useProductInteractions";

interface GroupedSearchResultsProps {
  groupedResults: GroupedSearchResults;
  onProductSelect?: (product: Product) => void;
  onCategoryExpand?: (categoryName: string) => void;
}

const GroupedSearchResultsComponent: React.FC<GroupedSearchResultsProps> = ({
  groupedResults,
  onProductSelect,
  onCategoryExpand
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
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};

interface CategorySectionProps {
  category: CategoryResults;
  onProductSelect?: (product: Product) => void;
  onCategoryExpand?: (categoryName: string) => void;
  isMobile: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onProductSelect,
  onCategoryExpand,
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
        
        {category.products.length >= 4 && (
          <div className="mt-4 text-center">
            <button
              onClick={handleSeeMore}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              See more {sectionTitle.toLowerCase()} →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupedSearchResultsComponent;
