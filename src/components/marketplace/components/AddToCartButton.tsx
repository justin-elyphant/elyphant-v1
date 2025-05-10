
import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  quantity?: number;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  product,
  variant = "default",
  size = "default", 
  className = "",
  quantity = 1
}) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  
  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    
    // Reset button state after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };
  
  return (
    <Button 
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={isAdded}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
