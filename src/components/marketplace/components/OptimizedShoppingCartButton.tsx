
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OptimizedShoppingCartButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const OptimizedShoppingCartButton: React.FC<OptimizedShoppingCartButtonProps> = ({ 
  className,
  variant = "ghost",
  size = "icon"
}) => {
  const navigate = useNavigate();
  
  // Safe cart hook usage with error boundary
  let itemCount = 0;
  try {
    const { getItemCount } = useCart();
    itemCount = getItemCount();
  } catch (error) {
    console.warn('[OptimizedShoppingCartButton] Cart context not available, showing default cart button');
    itemCount = 0;
  }

  const handleCartClick = () => {
    navigate("/cart");
  };
  
  return (
    <Button 
      variant={variant}
      size={size}
      className={cn("relative touch-target-44", className)}
      aria-label={`Shopping cart with ${itemCount} items`}
      onClick={handleCartClick}
    >
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 min-w-5 flex items-center justify-center text-xs font-bold"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
};

export default OptimizedShoppingCartButton;
