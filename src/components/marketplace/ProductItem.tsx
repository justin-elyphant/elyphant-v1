
import React from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, Star, StarHalf } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import WishlistSelectionPopover from "./WishlistSelectionPopover";

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

  // Render star ratings
  const renderRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return null;
    
    // Calculate full and half stars
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex text-yellow-500">
          {[...Array(fullStars)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ))}
          {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
        </div>
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)}
          {reviewCount && ` (${reviewCount})`}
        </span>
      </div>
    );
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
        <img 
          src={product.image || '/placeholder.svg'} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        {userData ? (
          <WishlistSelectionPopover 
            productId={product.id}
            productName={product.name}
            trigger={
              <Button 
                size="icon"
                variant="ghost" 
                className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8" 
              >
                <Heart className="h-4 w-4" />
              </Button>
            }
          />
        ) : (
          <Button 
            size="icon"
            variant="ghost" 
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8" 
            onClick={onWishlistClick}
          >
            <Heart className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className={`p-4 ${viewMode === 'list' ? 'w-2/3' : 'w-full'}`}>
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        {renderRating(product.rating, product.reviewCount)}
        <div className="font-bold mt-1">${product.price?.toFixed(2)}</div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-xs text-green-600">Free shipping</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
