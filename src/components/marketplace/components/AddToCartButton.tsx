
import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
  variant?: "default" | "outline" | "ghost" | "luxury";
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
  
  const handleAddToCart = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e); // Let parent stop propagation if needed
    }
    // Don't add if button is disabled
    if (isAdded) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };
  
  // Luxury variant uses custom styling
  if (variant === "luxury") {
    return (
      <button
        onClick={handleAddToCart}
        disabled={isAdded}
        className={cn(
          "px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isAdded ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Added
          </>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add
          </>
        )}
      </button>
    );
  }

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
