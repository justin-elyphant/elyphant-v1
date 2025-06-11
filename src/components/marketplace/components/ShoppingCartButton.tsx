
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

const ShoppingCartButton = () => {
  const { getItemCount } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const itemCount = getItemCount();

  const handleCartClick = () => {
    navigate("/cart");
  };

  return (
    <Button
      variant="ghost"
      size={isMobile ? "touch" : "icon"}
      className="relative h-10 w-10"
      aria-label={`Shopping cart with ${itemCount} items`}
      onClick={handleCartClick}
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
