
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModernProductCardProps {
  product: Product;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onAddToCart: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const ModernProductCard: React.FC<ModernProductCardProps> = ({
  product,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  onClick,
}) => {
  const isMobile = useIsMobile();
  
  // Ensure we have fallback values
  const title = product.title || product.name || "Product";
  const price = typeof product.price === 'number' ? product.price : 0;
  const productId = product.product_id || product.id || `product-${Math.random()}`;
  
  // Ensure image has a fallback
  const productImage = product.image || "https://placehold.co/400x400?text=Product";
  
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
  
  // Determine if product is a bestseller
  const isBestSeller = product.isBestSeller || 
                     (product.stars && product.stars >= 4.7) ||
                     (product.rating && product.rating >= 4.7);

  return (
    <Card 
      className="group overflow-hidden border hover:shadow-md transition-all duration-300 h-full"
      onClick={onClick}
    >
      <div className="relative overflow-hidden aspect-square">
        <img 
          src={productImage} 
          alt={title}
          className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // Fallback for broken images
            (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Product";
          }}
        />
        
        {isBestSeller && (
          <Badge variant="secondary" className="absolute top-2 left-2 bg-yellow-500 text-white">
            Bestseller
          </Badge>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "w-full bg-white hover:bg-white/90 text-black",
              isMobile && "py-2.5 text-sm" // Taller button on mobile
            )}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(e);
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "absolute top-2 right-2 bg-white/80 hover:bg-white/90 rounded-full",
            isMobile ? "h-10 w-10" : "h-8 w-8" // Larger for mobile touch targets
          )}
          onClick={(e) => onToggleFavorite(e)}
        >
          <Heart 
            className={cn(
              isMobile ? "h-5 w-5" : "h-4 w-4",
              isFavorited ? 'fill-red-500 text-red-500' : ''
            )} 
          />
        </Button>
      </div>
      <CardContent className={cn(
        isMobile ? "p-2.5" : "p-3" // Adjusted padding for mobile
      )}>
        <h3 className="font-medium text-sm line-clamp-2 mt-1 mb-1">{title}</h3>
        <p className="font-bold text-base">{formattedPrice}</p>
        
        {(product.stars || product.rating) && (
          <div className="flex items-center mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star}
                  className={star <= Math.round(product.stars || product.rating || 0) 
                    ? "text-yellow-400" 
                    : "text-gray-300"}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              {product.reviewCount || product.num_reviews || 0}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernProductCard;
