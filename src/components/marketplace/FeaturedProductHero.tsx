
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Calendar, Star, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getHighResAmazonImage } from "@/utils/amazonImageOptimizer";
import { getDisplayTitle } from "@/utils/productTitleUtils";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { motion } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

// Format number to compact display (1500 -> "1.5K")
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
};

// Format review count
const formatReviewCount = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(count);
};

interface FeaturedProductHeroProps {
  product: Product;
  searchTerm?: string;
  className?: string;
}

const FeaturedProductHero: React.FC<FeaturedProductHeroProps> = memo(({
  product,
  searchTerm,
  className
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  const productId = String(product.product_id || product.id);
  
  const getProductImage = () => {
    const mainImage = (product as any).main_image || product.image;
    return getHighResAmazonImage(mainImage, 'detail');
  };

  const getProductTitle = () => {
    const rawTitle = product.title || product.name || "Product";
    return getDisplayTitle(rawTitle, { 
      device: isMobile ? 'mobile' : 'desktop', 
      context: 'detail', 
      brand: product.brand 
    });
  };

  const getProductPrice = () => {
    const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0;
    return formatPrice(price);
  };

  const getRating = () => {
    return product.stars || product.rating || (product as any).metadata?.stars || 0;
  };

  const getReviewCount = () => {
    return product.review_count || product.reviewCount || product.num_reviews || 
           (product as any).metadata?.review_count || 0;
  };

  const handleProductClick = () => {
    triggerHapticFeedback('light');
    navigate(`/marketplace/product/${productId}`, {
      state: { 
        product, 
        context: 'marketplace',
        returnPath: window.location.pathname + window.location.search
      }
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('medium');
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error("Failed to add item to cart");
    }
  };

  const handleScheduleGift = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('light');
    navigate(`/marketplace/product/${productId}?action=schedule`, {
      state: { product }
    });
  };

  // Determine the best match badge text
  const getBadgeText = () => {
    if ((product as any).isBestSeller || (product as any).badgeText?.includes('Best Seller')) {
      return "Best Seller";
    }
    if ((product as any).bestSellerType === 'amazon_choice') {
      return "Amazon's Choice";
    }
    if ((product as any).popularity_score > 80) {
      return "Top Rated";
    }
    if ((product as any).is_cached && getRating() >= 4) {
      return "Best Match";
    }
    return "Featured";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "mb-8 rounded-2xl overflow-hidden bg-card border border-border",
        "shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}
    >
      <div 
        className={cn(
          "flex cursor-pointer",
          isMobile ? "flex-col" : "flex-row gap-8 p-6"
        )}
        onClick={handleProductClick}
      >
        {/* Image Section */}
        <div className={cn(
          "relative overflow-hidden bg-muted",
          isMobile ? "aspect-square w-full" : "w-80 h-80 flex-shrink-0 rounded-xl"
        )}>
          <img
            src={getProductImage()}
            alt={getProductTitle()}
            className="w-full h-full object-cover"
            loading="eager"
          />
          
          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <Badge 
              className={cn(
                "px-3 py-1.5 text-sm font-medium",
                "bg-gradient-to-r from-purple-600 to-sky-500 text-white border-0",
                "shadow-lg"
              )}
            >
              <Award className="w-3.5 h-3.5 mr-1.5" />
              {getBadgeText()}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className={cn(
          "flex-1 flex flex-col justify-between",
          isMobile ? "p-4" : "py-2"
        )}>
          {/* Top Content */}
          <div>
            {/* Title */}
            <h2 className={cn(
              "font-semibold text-foreground mb-2 line-clamp-2",
              isMobile ? "text-lg" : "text-2xl"
            )}>
              {getProductTitle()}
            </h2>

            {/* Rating with inline purchase indicator */}
            {getRating() > 0 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">
                    {getRating()}
                  </span>
                </div>
                {getReviewCount() > 0 && (
                  <span className="text-muted-foreground text-sm">
                    ({formatReviewCount(getReviewCount())} reviews)
                  </span>
                )}
                {/* Inline purchase indicator */}
                {((product as any).popularity_score > 50 || (product as any).view_count > 20) && (
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {formatCompactNumber(Math.floor(((product as any).popularity_score || 0) + ((product as any).view_count || 0)) * 10)}+ bought recently
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className={cn(
                "font-bold text-foreground",
                isMobile ? "text-2xl" : "text-3xl"
              )}>
                {getProductPrice()}
              </span>
              {(product as any).is_cached && (
                <span className="text-sm text-muted-foreground">
                  Free shipping eligible
                </span>
              )}
            </div>

            {/* Quick Description */}
            {(product as any).product_description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                {(product as any).product_description?.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "flex gap-3 mt-4",
            isMobile ? "flex-col" : "flex-row"
          )}>
            {/* Add to Wishlist - Primary */}
            {user ? (
              <div onClick={e => e.stopPropagation()}>
                <WishlistSelectionPopoverButton
                  product={{
                    id: productId,
                    name: getProductTitle(),
                    image: getProductImage(),
                    price: product.price,
                    brand: product.brand || "",
                  }}
                  triggerClassName={cn(
                    "flex items-center justify-center gap-2 px-6 py-3 rounded-full",
                    "bg-foreground text-background hover:bg-foreground/90",
                    "font-medium transition-all",
                    isMobile && "min-h-[44px] w-full"
                  )}
                  onAdded={() => {}}
                />
              </div>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHapticFeedback('light');
                  navigate('/auth');
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full",
                  "bg-foreground text-background hover:bg-foreground/90",
                  isMobile && "min-h-[44px] w-full"
                )}
              >
                <Heart className="w-4 h-4" />
                Add to Wishlist
              </Button>
            )}

            {/* Schedule Gift */}
            <Button
              variant="outline"
              onClick={handleScheduleGift}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full",
                "border-border hover:bg-accent",
                isMobile && "min-h-[44px] w-full"
              )}
            >
              <Calendar className="w-4 h-4" />
              Schedule Gift
            </Button>

            {/* Add to Cart */}
            <Button
              variant="outline"
              onClick={handleAddToCart}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full",
                "border-border hover:bg-accent",
                isMobile && "min-h-[44px] w-full"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

FeaturedProductHero.displayName = 'FeaturedProductHero';

export default FeaturedProductHero;
