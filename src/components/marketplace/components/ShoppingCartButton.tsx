
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ShoppingCartButtonProps {
  className?: string;
}

const ShoppingCartButton: React.FC<ShoppingCartButtonProps> = ({ className }) => {
  const { items } = useCart();
  const navigate = useNavigate();
  
  const itemCount = items.length;
  
  const handleCartClick = () => {
    navigate("/cart");
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={cn("relative", className)}
      onClick={handleCartClick}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="h-4 w-4 p-0 min-w-4 flex items-center justify-center absolute -top-1 -right-1 text-[10px]"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
};

export default ShoppingCartButton;
