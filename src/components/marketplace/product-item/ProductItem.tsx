
import React from "react";
import { Product } from "@/contexts/ProductContext";
import ProductImage from "./ProductImage";
import ProductRating from "./ProductRating";
import ProductDetails from "./ProductDetails";
import WishlistButton from "./WishlistButton";  // Fixed path
import { useAuth } from "@/contexts/auth";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick: (productId: number) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick,
  onWishlistClick,
  isFavorited 
}: ProductItemProps) => {
  const { user } = useAuth(); // Changed from userData to user

  return (
    <div 
      className={`group relative rounded-lg overflow-hidden border ${
        viewMode === 'grid' ? 'h-full flex flex-col' : 'flex'
      } bg-white hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onProductClick(product.id)}
      data-testid={`product-item-${product.id}`}
    >
      <div className={viewMode === 'grid' ? 'relative' : 'w-1/4'}>
        <ProductImage 
          product={product} 
          // Remove className prop as it's not in ProductImageProps
        />
        <WishlistButton 
          userData={user}
          productId={product.id}
          productName={product.name}
          onWishlistClick={onWishlistClick}
          isFavorited={isFavorited}
        />
      </div>
      
      <ProductDetails 
        product={product} 
        onAddToCart={(e) => {
          e.stopPropagation();
          // This is just a placeholder to satisfy the prop requirement
          console.log("Add to cart:", product.id);
        }}
      />
    </div>
  );
};

export default ProductItem;
