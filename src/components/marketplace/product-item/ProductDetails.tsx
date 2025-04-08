
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductRating from "@/components/marketplace/product-item/ProductRating";
import { formatProductPrice } from "./productUtils";

interface ProductDetailsProps {
  product: {
    name: string;
    price: number;
    rating?: number;
    reviewCount?: number;
  };
  onAddToCart: (e: React.MouseEvent) => void;
}

const ProductDetails = ({ product, onAddToCart }: ProductDetailsProps) => {
  return (
    <div className="p-4 w-full">
      <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
      <ProductRating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
      <div className="font-bold mt-1">${formatProductPrice(product.price)}</div>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-green-600">Free shipping</span>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductDetails;
