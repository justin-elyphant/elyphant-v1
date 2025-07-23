
import React from "react";
import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CategorySectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  onProductClick?: (product: Product) => void;
  showSeeAll?: boolean;
  onAddToCart?: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  subtitle,
  products,
  isLoading = false,
  onSeeAll,
  onProductClick,
  showSeeAll = true,
  onAddToCart,
  onShare
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          No products found in this category
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        {showSeeAll && onSeeAll && (
          <Button
            variant="outline"
            onClick={onSeeAll}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            See All
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => (
          <div key={product.product_id} className="flex-shrink-0 w-48">
            <ProductCard
              product={product}
              onClick={() => onProductClick?.(product)}
              onAddToCart={onAddToCart}
              onShare={onShare}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
