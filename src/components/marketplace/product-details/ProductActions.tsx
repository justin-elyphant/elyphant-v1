
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductActionsProps {
  product: Product;
  userData: any | null;
}

const ProductActions = ({ product, userData }: ProductActionsProps) => {
  const { addToCart } = useCart();

  return (
    <div className="mt-auto pt-4 flex flex-col space-y-2">
      <Button 
        onClick={() => {
          addToCart(product);
          toast.success("Product added to cart!");
        }}
        className="w-full"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
      </Button>
      
      {userData && (
        <Button variant="outline" className="w-full">
          <Heart className="h-4 w-4 mr-2" />
          Add to Wishlist
        </Button>
      )}
    </div>
  );
};

export default ProductActions;
