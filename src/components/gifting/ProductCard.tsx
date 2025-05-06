
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import ProductRating from "@/components/shared/ProductRating";
import { formatProductPrice } from "../marketplace/product-item/productUtils";
import { 
  getProductId, 
  getProductName,
  getProductCategory
} from "../marketplace/product-item/productUtils";
import SignUpDialog from "../marketplace/SignUpDialog";
import { useAuth } from "@/contexts/auth";

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  isGifteeView: boolean;
  onToggleWishlist: (productId: string) => void;
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
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
    
    onToggleWishlist(String(getProductId(product)));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    
    toast.success("Added to Cart", {
      description: `${getProductName(product)} has been added to your cart`
    });
  };

  // Determine if product should be marked as bestseller
  const isBestSeller = product.isBestSeller || 
                       (product.num_sales && product.num_sales > 1000) ||
                       (product.stars && product.stars >= 4.8);

  return (
    <>
      <Card 
        key={getProductId(product)} 
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={product.image} 
            alt={getProductName(product)}
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
          
          {isBestSeller && (
            <Badge 
              variant="default" 
              className="absolute top-2 left-2 bg-yellow-500 text-white"
            >
              Best Seller
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-1">{getProductName(product)}</h3>
          <p className="font-semibold text-sm">${formatProductPrice(product.price)}</p>
          
          <ProductRating 
            rating={product.rating || product.stars || 0} 
            reviewCount={product.reviewCount || product.num_reviews || 0} 
            size="sm" 
          />
          
          {getProductCategory(product) && (
            <Badge variant="outline" className="mt-2 text-xs">
              {getProductCategory(product)}
            </Badge>
          )}
        </CardContent>
      </Card>
      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ProductCard;
