
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

  // Get a product-specific image based on name and category
  const getFallbackImage = () => {
    const name = product.name.toLowerCase();
    const category = product.category?.toLowerCase() || '';
    
    // Apple products
    if (name.includes('iphone')) {
      return 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop'; // iPhone
    }
    if (name.includes('macbook') || name.includes('mac book')) {
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'; // MacBook
    }
    if (name.includes('airpods')) {
      return 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=500&h=500&fit=crop'; // AirPods
    }
    if (name.includes('ipad')) {
      return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop'; // iPad
    }
    if (name.includes('apple watch') || name.includes('watch') && name.includes('apple')) {
      return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop'; // Apple Watch
    }
    if (name.includes('apple tv')) {
      return 'https://images.unsplash.com/photo-1528928441742-b4ccac1bb04c?w=500&h=500&fit=crop'; // Apple TV
    }
    if (name.includes('apple pencil') || name.includes('pencil') && name.includes('apple')) {
      return 'https://images.unsplash.com/photo-1595411425732-e69c1aba47b3?w=500&h=500&fit=crop'; // Apple Pencil
    }
    
    // Samsung products
    if (name.includes('samsung') && (name.includes('galaxy') || name.includes('phone'))) {
      return 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=500&h=500&fit=crop'; // Samsung Galaxy
    }
    if (name.includes('samsung') && name.includes('tv')) {
      return 'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=500&h=500&fit=crop'; // Samsung TV
    }
    
    // Gaming/Console products
    if (name.includes('playstation') || name.includes('ps5') || name.includes('ps4')) {
      return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop'; // PlayStation
    }
    if (name.includes('xbox')) {
      return 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&h=500&fit=crop'; // Xbox
    }
    if (name.includes('nintendo') || name.includes('switch')) {
      return 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&h=500&fit=crop'; // Nintendo Switch
    }
    
    // Headphones and Speakers
    if (name.includes('headphone') || name.includes('earphone') || name.includes('earbud')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'; // Headphones
    }
    if (name.includes('speaker') || name.includes('echo') || name.includes('alexa')) {
      return 'https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=500&h=500&fit=crop'; // Speaker
    }
    
    // Footwear
    if (name.includes('nike') || (name.includes('shoe') && name.includes('nike'))) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'; // Nike shoes
    }
    if (name.includes('adidas') || (name.includes('shoe') && name.includes('adidas'))) {
      return 'https://images.unsplash.com/photo-1518894950606-4642a0c087f9?w=500&h=500&fit=crop'; // Adidas shoes
    }
    
    // Category fallbacks (if no specific product match)
    if (category.includes('electronics')) {
      return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&h=500&fit=crop'; // Electronics
    }
    if (category.includes('footwear') || category.includes('shoes')) {
      return 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=500&h=500&fit=crop'; // Shoes
    }
    if (category.includes('clothing') || category.includes('apparel')) {
      return 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=500&h=500&fit=crop'; // Clothing
    }
    if (category.includes('home') || category.includes('kitchen')) {
      return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop'; // Home/Kitchen
    }
    if (category.includes('sports')) {
      return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&h=500&fit=crop'; // Sports
    }
    
    // Generic product image if no specific match
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
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
              onError={() => console.log(`Fallback image also failed for: ${product.name}`)}
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
