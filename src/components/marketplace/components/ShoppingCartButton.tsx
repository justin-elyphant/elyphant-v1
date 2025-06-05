
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

const ShoppingCartButton = () => {
  const { getItemCount } = useCart();
  const isMobile = useIsMobile();
  const itemCount = getItemCount();

  const handleCartClick = () => {
    // This could open a cart drawer/modal in the future
    console.log("Cart clicked with", itemCount, "items");
  };

  return (
    <Button
      variant="ghost"
      size={isMobile ? "touch" : "icon"}
      onClick={handleCartClick}
      className="relative h-10 w-10"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart size={isMobile ? 24 : 20} />
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </Button>
  );
};

export default ShoppingCartButton;
