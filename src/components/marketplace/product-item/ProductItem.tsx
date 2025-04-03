
import React from "react";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import ProductImage from "./ProductImage";
import ProductDetails from "./ProductDetails";
import WishlistButton from "./WishlistButton";
import { Badge } from "@/components/ui/badge";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick: (productId: number) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick,
  onWishlistClick
}: ProductItemProps) => {
  const { addToCart } = useCart();
  const [userData] = useLocalStorage("userData", null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div 
      className={`${
        viewMode === 'grid' 
          ? 'group border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer' 
          : 'flex border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer'
      }`}
      onClick={() => onProductClick(product.id)}
    >
      <div className={`${viewMode === 'list' ? 'w-1/3' : 'w-full'} relative`}>
        <ProductImage product={product} />
        {product.isBestSeller && (
          <Badge 
            variant="default" 
            className="absolute top-2 left-2 bg-yellow-500 text-white"
          >
            Best Seller
          </Badge>
        )}
        <WishlistButton 
          userData={userData} 
          productId={product.id} 
          productName={product.name} 
          onWishlistClick={onWishlistClick} 
        />
      </div>
      
      <div className={`${viewMode === 'list' ? 'w-2/3' : 'w-full'}`}>
        <ProductDetails product={product} onAddToCart={handleAddToCart} />
      </div>
    </div>
  );
};

export default ProductItem;
