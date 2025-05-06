
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Eye } from "lucide-react";

interface AccessibleProductControlsProps {
  productId: string;
  productName: string;
  isFavorited: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
  onAddToCart: (e: React.MouseEvent) => void;
  onViewDetails: () => void;
  keyboardNavigationEnabled?: boolean;
}

const AccessibleProductControls: React.FC<AccessibleProductControlsProps> = ({
  productId,
  productName,
  isFavorited,
  onFavoriteToggle,
  onAddToCart,
  onViewDetails,
  keyboardNavigationEnabled = true
}) => {
  const favoriteButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus on the favorite button when it becomes visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardNavigationEnabled) return;
      
      // Alt + W to toggle wishlist
      if (e.altKey && e.key === 'w') {
        e.preventDefault();
        favoriteButtonRef.current?.click();
      }
      
      // Alt + C to add to cart
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        // Dispatch a synthetic click event
        const target = document.querySelector(`[data-cart-product-id="${productId}"]`);
        if (target) {
          target.dispatchEvent(event);
        }
      }
      
      // Alt + V to view details
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        onViewDetails();
      }
    };
    
    if (keyboardNavigationEnabled) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardNavigationEnabled, productId, onViewDetails]);
  
  return (
    <div 
      className="flex items-center justify-around gap-2 mt-2" 
      role="group"
      aria-label={`Controls for ${productName}`}
    >
      <Button
        ref={favoriteButtonRef}
        size="sm"
        variant={isFavorited ? "default" : "outline"}
        className={`flex-1 ${isFavorited ? "bg-red-500 hover:bg-red-600" : ""}`}
        onClick={onFavoriteToggle}
        aria-label={isFavorited ? `Remove ${productName} from favorites` : `Add ${productName} to favorites`}
        aria-pressed={isFavorited}
        data-wishlist-product-id={productId}
      >
        <Heart className={`h-4 w-4 mr-1 ${isFavorited ? "fill-white" : ""}`} />
        <span className="sr-only md:not-sr-only md:inline text-xs">
          {isFavorited ? "Favorited" : "Favorite"}
        </span>
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={onAddToCart}
        aria-label={`Add ${productName} to cart`}
        data-cart-product-id={productId}
      >
        <ShoppingCart className="h-4 w-4 mr-1" />
        <span className="sr-only md:not-sr-only md:inline text-xs">Cart</span>
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={onViewDetails}
        aria-label={`View details of ${productName}`}
      >
        <Eye className="h-4 w-4 mr-1" />
        <span className="sr-only md:not-sr-only md:inline text-xs">Details</span>
      </Button>
    </div>
  );
};

export default AccessibleProductControls;
