
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
  onClick?: (e: React.MouseEvent) => void;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  product,
  variant = "default",
  size = "default", 
  className = "",
  quantity = 1,
  onClick
}) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Always stop propagation to prevent card clicks
    
    if (onClick) {
      onClick(e);
    }
    
    // Prevent multiple rapid clicks
    if (isAdded || isAdding) return;
    
    setIsAdding(true);
    
    try {
      addToCart(product, quantity);
      setIsAdded(true);
      
      // Reset the added state after animation
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <Button 
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={isAdded || isAdding}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added
        </>
      ) : isAdding ? (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Adding...
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
