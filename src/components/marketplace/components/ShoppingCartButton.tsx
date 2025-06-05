
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import { useIsMobile } from "@/hooks/use-mobile";

const ShoppingCartButton = () => {
  const { items, toggleCart } = useCartStore();
  const isMobile = useIsMobile();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Button
      variant="ghost"
      size={isMobile ? "touch" : "icon"}
      onClick={toggleCart}
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
