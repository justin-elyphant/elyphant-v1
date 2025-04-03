
import React from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, Star, StarHalf, ImageOff } from "lucide-react";
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
  const [imageError, setImageError] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    
    toast.success(`${product.name} added to cart`);
  };

  const handleImageError = () => {
    console.log(`Image failed to load for product: ${product.name}`);
    setImageError(true);
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

  // Get a fallback image based on product name or category
  const getFallbackImage = () => {
    const name = product.name.toLowerCase();
    const category = product.category?.toLowerCase() || '';
    
    if (name.includes('apple') || name.includes('iphone') || name.includes('macbook')) {
      return 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=500'; // Apple related
    }
    
    if (name.includes('samsung') || name.includes('galaxy')) {
      return 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=500'; // Samsung related
    }
    
    if (name.includes('nike') || category.includes('footwear') || name.includes('shoe')) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'; // Nike/shoes
    }
    
    if (category.includes('electronics')) {
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500'; // Electronics
    }
    
    return '/placeholder.svg'; // Default placeholder
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
        {imageError ? (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <img 
              src={getFallbackImage()}
              alt={product.name}
              className="w-full h-48 object-cover"
              onError={handleImageError}
            />
          </div>
        ) : (
          <img 
            src={product.image || '/placeholder.svg'} 
            alt={product.name} 
            className="w-full h-48 object-cover"
            onError={handleImageError}
          />
        )}
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
