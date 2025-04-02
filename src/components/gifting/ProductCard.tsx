
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  isGifteeView: boolean;
  onToggleWishlist: (productId: number) => void;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  isGifteeView,
  onToggleWishlist,
  onClick,
}) => {
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  return (
    <Card 
      key={product.id} 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="object-cover w-full h-full transform transition-transform hover:scale-105"
          loading="lazy"
        />
        
        {isGifteeView && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
            onClick={handleWishlistToggle}
          >
            <Heart 
              className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </Button>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
        <p className="text-xs text-muted-foreground mb-1">{product.vendor}</p>
        <p className="font-semibold text-sm">${product.price.toFixed(2)}</p>
        
        {product.category && (
          <Badge variant="outline" className="mt-2 text-xs">
            {product.category}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
