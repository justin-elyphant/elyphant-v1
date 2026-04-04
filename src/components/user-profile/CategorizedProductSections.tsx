import React from "react";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, Bot, TrendingUp } from "lucide-react";
import { Product } from "@/types/product";
import ProductCard from "@/components/marketplace/ProductCard";

interface CategorizedProductSectionsProps {
  wishlistProducts: Product[];
  interestProducts: Product[];
  aiProducts: Product[];
  trendingProducts: Product[];
  onProductClick: (product: Product, source: string) => void;
  isOwnProfile: boolean;
  isPreviewMode?: boolean;
}

const CategorizedProductSections: React.FC<CategorizedProductSectionsProps> = ({
  wishlistProducts,
  interestProducts,
  aiProducts,
  trendingProducts,
  onProductClick,
  isOwnProfile,
  isPreviewMode = false
}) => {
  const renderSection = (
    title: string,
    products: Product[],
    icon: React.ComponentType<any>,
    source: string,
    description?: string
  ) => {
    if (products.length === 0) return null;

    const Icon = icon;
    
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <Badge variant="secondary" className="ml-auto">{products.length} items</Badge>
        </div>
        
        <div className={`grid gap-3 ${
          source === 'wishlist' 
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
            : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
        }`}>
          {products.slice(0, source === 'wishlist' ? 12 : 6).map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              onProductClick={() => onProductClick(product, source)}
              viewMode="grid"
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection(
        "Their Wishlist",
        wishlistProducts,
        Heart,
        'wishlist',
        "Items they actually want - perfect gift ideas!"
      )}

      {renderSection(
        "Based on Their Interests",
        interestProducts,
        Target,
        'interests',
        "Products matching their hobbies and preferences"
      )}

      {!isOwnProfile && !isPreviewMode && renderSection(
        "AI Gift Suggestions",
        aiProducts,
        Bot,
        'ai',
        "Smart recommendations based on their profile"
      )}

      {renderSection(
        "Popular Right Now",
        trendingProducts,
        TrendingUp,
        'trending',
        "Trending gifts people love"
      )}
    </div>
  );
};

export default CategorizedProductSections;
