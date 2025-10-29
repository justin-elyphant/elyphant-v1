import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, Bot, TrendingUp, ExternalLink } from "lucide-react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";

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
  const renderProductCard = (product: Product, source: string, size: 'large' | 'medium' | 'small' = 'medium') => {
    const sizeClasses = {
      large: 'col-span-2 row-span-2',
      medium: 'col-span-1 row-span-1',
      small: 'col-span-1 row-span-1'
    };

    return (
      <Card 
        key={product.product_id}
        className={`${sizeClasses[size]} cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden`}
        onClick={() => onProductClick(product, source)}
      >
        <CardContent className="p-0 relative h-full">
          <div className="aspect-square relative overflow-hidden">
            <img 
              src={product.image || '/placeholder.svg'} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            {/* Overlay with product info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">{product.title}</h4>
                <p className="text-lg font-bold">{formatPrice(product.price)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
        
        {/* Grid layout - larger cards for wishlist, smaller for others */}
        <div className={`grid gap-3 ${
          source === 'wishlist' 
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
            : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
        }`}>
          {products.slice(0, source === 'wishlist' ? 12 : 6).map((product) => 
            renderProductCard(product, source, source === 'wishlist' ? 'medium' : 'small')
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Primary Section: Wishlist Items */}
      {renderSection(
        "Their Wishlist",
        wishlistProducts,
        Heart,
        'wishlist',
        "Items they actually want - perfect gift ideas!"
      )}

      {/* Secondary Section: Interest-Based */}
      {renderSection(
        "Based on Their Interests",
        interestProducts,
        Target,
        'interests',
        "Products matching their hobbies and preferences"
      )}

      {/* Tertiary Section: AI Recommendations (only for others viewing) */}
      {!isOwnProfile && !isPreviewMode && renderSection(
        "AI Gift Suggestions",
        aiProducts,
        Bot,
        'ai',
        "Smart recommendations based on their profile"
      )}

      {/* Quaternary Section: Trending */}
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