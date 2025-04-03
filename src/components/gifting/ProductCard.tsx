import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

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
  const { addToCart } = useCart();
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart`
    });
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
        
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {isGifteeView && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/80 hover:bg-white rounded-full h-8 w-8"
              onClick={handleWishlistToggle}
            >
              <Heart 
                className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-white/80 hover:bg-white rounded-full h-8 w-8"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
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
