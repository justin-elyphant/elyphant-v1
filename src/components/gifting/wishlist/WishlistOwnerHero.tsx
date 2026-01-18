
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Gift, MapPin, Shield, Package, Loader2 } from "lucide-react";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import { triggerHapticFeedback } from "@/utils/haptics";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WishlistOwnerHeroProps {
  owner: {
    name: string;
    image?: string;
    id: string;
    bio?: string;
    location?: string;
  };
  wishlist: {
    title: string;
    description?: string;
    category?: string;
  };
  itemCount: number;
  totalPrice: number;
  purchasedCount: number;
  onAddAllToCart: () => void;
  isAdding?: boolean;
}

const WishlistOwnerHero: React.FC<WishlistOwnerHeroProps> = ({
  owner,
  wishlist,
  itemCount,
  totalPrice,
  purchasedCount,
  onAddAllToCart,
  isAdding = false
}) => {
  const availableCount = itemCount - purchasedCount;
  const formattedTotal = `$${totalPrice.toFixed(2)}`;

  const handleAddAllClick = () => {
    triggerHapticFeedback('success');
    onAddAllToCart();
  };

  const handleAvatarClick = () => {
    triggerHapticFeedback('light');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 md:mb-8"
    >
      {/* Main Hero Card */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 lg:p-8 shadow-sm">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col items-center text-center md:hidden">
          {/* Avatar */}
          <Link 
            to={`/user/${owner.id}`} 
            onClick={handleAvatarClick}
            className="touch-manipulation"
          >
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg ios-touch-feedback active:scale-95 transition-transform">
              <AvatarImage 
                src={normalizeImageUrl(owner.image, { bucket: 'avatars' })}
                alt={owner.name}
              />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {owner.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Wishlist Title & Category */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{wishlist.title}</h1>
              {wishlist.category && (
                <WishlistCategoryBadge category={wishlist.category} size="sm" />
              )}
            </div>
            
            {/* Owner Info */}
            <p className="text-sm text-muted-foreground">
              Created by <span className="font-medium text-foreground">{owner.name}</span>
            </p>
            
            {owner.location && (
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{owner.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {wishlist.description && (
            <p className="mt-3 text-sm text-muted-foreground italic max-w-md">
              "{wishlist.description}"
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{availableCount} items</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
              <span className="text-sm font-medium">{formattedTotal}</span>
            </div>
          </div>

          {/* Add All CTA */}
          <Button
            onClick={handleAddAllClick}
            disabled={isAdding || availableCount === 0}
            className={cn(
              "w-full mt-4 min-h-[48px] text-base font-semibold",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "touch-manipulation active:scale-[0.98] transition-transform",
              "disabled:opacity-50"
            )}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </>
            )}
          </Button>

          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure checkout</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>Direct shipping</span>
            </div>
          </div>
        </div>

        {/* Tablet & Desktop Layout - Horizontal */}
        <div className="hidden md:flex md:items-start md:gap-6 lg:gap-8">
          {/* Avatar */}
          <Link 
            to={`/user/${owner.id}`} 
            onClick={handleAvatarClick}
            className="flex-shrink-0"
          >
            <Avatar className="h-16 w-16 lg:h-20 lg:w-20 border-4 border-background shadow-lg hover:scale-105 transition-transform">
              <AvatarImage 
                src={normalizeImageUrl(owner.image, { bucket: 'avatars' })}
                alt={owner.name}
              />
              <AvatarFallback className="text-xl lg:text-2xl font-semibold bg-primary/10 text-primary">
                {owner.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{wishlist.title}</h1>
                  {wishlist.category && (
                    <WishlistCategoryBadge category={wishlist.category} />
                  )}
                </div>
                
                {/* Owner Info */}
                <p className="mt-1 text-sm text-muted-foreground">
                  Created by{" "}
                  <Link 
                    to={`/user/${owner.id}`} 
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {owner.name}
                  </Link>
                  {owner.location && (
                    <>
                      <span className="mx-1.5">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {owner.location}
                      </span>
                    </>
                  )}
                </p>

                {/* Description */}
                {wishlist.description && (
                  <p className="mt-2 text-sm text-muted-foreground italic max-w-2xl">
                    "{wishlist.description}"
                  </p>
                )}
              </div>
            </div>

            {/* Stats & CTA Row */}
            <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{availableCount} items</span>
                  {purchasedCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({purchasedCount} purchased)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                  <span className="text-sm font-bold">{formattedTotal}</span>
                  <span className="text-xs text-muted-foreground">total</span>
                </div>
              </div>

              <Button
                onClick={handleAddAllClick}
                disabled={isAdding || availableCount === 0}
                size="lg"
                className={cn(
                  "min-h-[44px] px-6 text-base font-semibold",
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                  "hover:scale-[1.02] active:scale-[0.98] transition-all"
                )}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add All to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Ships directly from retailer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WishlistOwnerHero;
