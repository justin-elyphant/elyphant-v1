import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/contexts/ProductContext";
import type { GroupedSearchResults, CategoryResults } from "@/services/ai/multiCategorySearchService";
import { useIsMobile } from "@/hooks/use-mobile";

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
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Gift Ideas by Category
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Found {groupedResults.totalResults} products across {groupedResults.categories.length} categories
        </p>
      </div>

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
  const handleSeeMore = () => {
    if (onCategoryExpand) {
      onCategoryExpand(category.categoryName);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            {category.displayName}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {category.resultCount} items
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          Search: "{category.searchQuery}"
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={`grid gap-3 ${
          isMobile 
            ? 'grid-cols-2' 
            : 'grid-cols-4'
        }`}>
          {category.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductSelect}
              compact={isMobile}
            />
          ))}
        </div>
        
        {category.products.length >= 4 && (
          <div className="mt-4 text-center">
            <button
              onClick={handleSeeMore}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              See more {category.displayName.toLowerCase()} →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  compact: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  compact
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(product);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      <div className={`aspect-square bg-gray-100 ${compact ? 'h-20' : 'h-32'}`}>
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.title || product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      
      <div className="p-2">
        <h4 className={`font-medium text-gray-900 line-clamp-2 ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          {product.title || product.name}
        </h4>
        
        <div className="flex items-center justify-between mt-1">
          <span className={`font-semibold text-purple-600 ${
            compact ? 'text-xs' : 'text-sm'
          }`}>
            ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </span>
          
          {product.rating && (
            <div className="flex items-center">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-xs text-gray-500 ml-1">
                {product.rating}
              </span>
            </div>
          )}
        </div>
        
        <p className={`text-gray-500 mt-1 ${
          compact ? 'text-xs' : 'text-xs'
        }`}>
          {product.vendor}
        </p>
      </div>
    </div>
  );
};

export default GroupedSearchResultsComponent;
