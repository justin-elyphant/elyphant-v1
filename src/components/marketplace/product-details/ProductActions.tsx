
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import BuyNowButton from "./BuyNowButton";
import SignUpDialog from "../SignUpDialog";
import { useAuth } from "@/contexts/auth";

interface ProductActionsProps {
  product: any;
  className?: string;
  onAddToCart?: () => void;
  onAddToWishlist?: (e: React.MouseEvent) => void;
  isInWishlist?: boolean;
  userData?: any;
}

const ProductActions = ({
  product,
  className = "",
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
  userData,
}: ProductActionsProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    if (onAddToCart) onAddToCart();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowSignUpDialog(true);
      return;
    }
    
    if (onAddToWishlist) {
      onAddToWishlist(e);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          variant="outline"
          className="flex-1 border-primary/20"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button
          variant={isInWishlist ? "default" : "outline"}
          size="icon"
          className={
            isInWishlist
              ? "bg-rose-500 hover:bg-rose-600 border-none"
              : "border-rose-200 hover:bg-rose-50 hover:border-rose-300"
          }
          onClick={handleWishlistClick}
        >
          <Heart
            className={`h-4 w-4 ${
              isInWishlist ? "fill-white text-white" : "text-rose-500"
            }`}
          />
        </Button>
      </div>
      
      <BuyNowButton 
        productId={product.id}
        productName={product.name}
        price={product.price}
        productImage={product.image}
        className="w-full"
      />

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </div>
  );
};

export default ProductActions;
