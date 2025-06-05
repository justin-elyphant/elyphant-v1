
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import CartDrawer from "../cart/CartDrawer";

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
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  
  return (
    <CartDrawer>
      <Button 
        variant={variant}
        size={size}
        className={cn("relative touch-target-44", className)}
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 min-w-5 flex items-center justify-center text-xs font-bold"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    </CartDrawer>
  );
};

export default OptimizedShoppingCartButton;
