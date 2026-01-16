import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

interface SuggestionProduct {
  product_id?: string;
  id?: string;
  title?: string;
  name?: string;
  image?: string;
  price?: number;
  stars?: number;
  rating?: number;
  review_count?: number;
}

interface SuggestionProductCardProps {
  product: SuggestionProduct;
  onQuickAdd?: (product: SuggestionProduct) => void;
  isAdding?: boolean;
  className?: string;
}

const SuggestionProductCard: React.FC<SuggestionProductCardProps> = ({
  product,
  onQuickAdd,
  isAdding = false,
  className
}) => {
  const navigate = useNavigate();
  
  const productId = product.product_id || product.id || '';
  const productTitle = product.title || product.name || 'Product';
  const productRating = product.stars || product.rating || 0;
  const formattedPrice = product.price 
    ? `$${product.price.toFixed(2)}` 
    : '';

  const handleCardClick = () => {
    triggerHapticFeedback(HapticPatterns.cardTap);
    navigate(`/product/${productId}`);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback(HapticPatterns.wishlistAdd);
    onQuickAdd?.(product);
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 w-36 touch-manipulation cursor-pointer group",
        "transition-transform duration-200 active:scale-[0.98]",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
        {product.image ? (
          <img
            src={product.image}
            alt={productTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}
        
        {/* Quick Add Button - Overlay */}
        <Button
          size="sm"
          variant="secondary"
          className={cn(
            "absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full",
            "bg-background/90 backdrop-blur-sm shadow-md",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "touch-manipulation min-h-[44px] min-w-[44px]",
            // Always show on mobile (no hover state)
            "md:opacity-0 md:group-hover:opacity-100"
          )}
          style={{ opacity: 1 }} // Always visible on touch devices
          onClick={handleQuickAdd}
          disabled={isAdding}
        >
          {isAdding ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Product Info */}
      <div className="space-y-1 px-0.5">
        <p className="text-sm font-medium line-clamp-2 leading-tight text-foreground">
          {productTitle}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          {formattedPrice && (
            <span className="text-sm font-semibold text-foreground">
              {formattedPrice}
            </span>
          )}
          
          {productRating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{productRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionProductCard;
