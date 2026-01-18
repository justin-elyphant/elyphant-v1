
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
  
  // Extract first name for friendlier headline
  const firstName = owner.name?.split(' ')[0] || owner.name || 'Someone';

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
      {/* Gradient Hero Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#FB923C]">
        <div className="p-6 md:p-8 lg:p-10">
          
          {/* Mobile Layout - Centered */}
          <div className="flex flex-col items-center text-center md:hidden">
            {/* Badge */}
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm mb-4">
              SHARED WISHLIST
            </Badge>
            
            {/* Avatar */}
            <Link 
              to={`/user/${owner.id}`} 
              onClick={handleAvatarClick}
              className="touch-manipulation"
            >
              <Avatar className="h-20 w-20 border-4 border-white/80 shadow-xl ios-touch-feedback active:scale-95 transition-transform">
                <AvatarImage 
                  src={normalizeImageUrl(owner.image, { bucket: 'avatars' })}
                  alt={owner.name}
                />
                <AvatarFallback className="text-2xl font-semibold bg-white/20 text-white">
                  {owner.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* Headline */}
            <div className="mt-4 space-y-1">
              <h1 className="text-2xl font-bold text-white">
                Here's {firstName}'s Wishlist
              </h1>
              <p className="text-xl font-medium text-white/90">
                for {wishlist.title}
              </p>
              
              {/* Category Badge */}
              {wishlist.category && (
                <div className="pt-2">
                  <WishlistCategoryBadge category={wishlist.category} size="sm" />
                </div>
              )}
            </div>

            {/* Location */}
            {owner.location && (
              <div className="flex items-center justify-center gap-1 text-sm text-white/70 mt-2">
                <MapPin className="h-3 w-3" />
                <span>{owner.location}</span>
              </div>
            )}

            {/* Description */}
            {wishlist.description && (
              <p className="mt-3 text-sm text-white/80 italic max-w-md">
                "{wishlist.description}"
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                {availableCount} items
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-semibold">
                {formattedTotal}
              </span>
            </div>

            {/* Add All CTA */}
            <Button
              onClick={handleAddAllClick}
              disabled={isAdding || availableCount === 0}
              className={cn(
                "w-full mt-4 min-h-[48px] text-base font-semibold",
                "bg-white text-[#EF4444] hover:bg-white/90",
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
            <div className="flex items-center justify-center gap-3 mt-4 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure checkout</span>
              </div>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Direct shipping</span>
              </div>
            </div>
          </div>

          {/* Tablet & Desktop Layout - Horizontal with avatar on right */}
          <div className="hidden md:block">
            {/* Badge */}
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm mb-4">
              SHARED WISHLIST
            </Badge>
            
            <div className="flex items-start justify-between gap-6 lg:gap-8">
              {/* Content - Left Side */}
              <div className="flex-1 min-w-0">
                {/* Headline */}
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  Here's {firstName}'s Wishlist
                </h1>
                <p className="text-2xl lg:text-3xl font-medium text-white/90 mt-1">
                  for {wishlist.title}
                </p>
                
                {/* Category Badge */}
                {wishlist.category && (
                  <div className="mt-3">
                    <WishlistCategoryBadge category={wishlist.category} />
                  </div>
                )}

                {/* Location */}
                {owner.location && (
                  <div className="flex items-center gap-1 text-sm text-white/70 mt-2">
                    <MapPin className="h-3 w-3" />
                    <span>{owner.location}</span>
                  </div>
                )}

                {/* Description */}
                {wishlist.description && (
                  <p className="mt-3 text-sm text-white/80 italic max-w-2xl">
                    "{wishlist.description}"
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-3 mt-4">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5">
                    <Gift className="h-4 w-4" />
                    {availableCount} items
                    {purchasedCount > 0 && (
                      <span className="text-xs text-white/60">
                        ({purchasedCount} purchased)
                      </span>
                    )}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm">
                    <span className="font-bold">{formattedTotal}</span>
                    <span className="text-white/70 ml-1">total</span>
                  </span>
                </div>

                {/* CTA & Trust */}
                <div className="flex flex-col sm:flex-row items-start gap-4 mt-6">
                  <Button
                    onClick={handleAddAllClick}
                    disabled={isAdding || availableCount === 0}
                    size="lg"
                    className={cn(
                      "min-h-[44px] px-6 text-base font-semibold",
                      "bg-white text-[#EF4444] hover:bg-white/90",
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
                  
                  <div className="flex items-center gap-4 text-xs text-white/70">
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

              {/* Desktop Avatar - Right Side */}
              <div className="flex-shrink-0">
                <Link 
                  to={`/user/${owner.id}`} 
                  onClick={handleAvatarClick}
                  className="block"
                >
                  <Avatar className="h-20 w-20 lg:h-24 lg:w-24 border-4 border-white/80 shadow-xl hover:scale-105 transition-transform">
                    <AvatarImage 
                      src={normalizeImageUrl(owner.image, { bucket: 'avatars' })}
                      alt={owner.name}
                    />
                    <AvatarFallback className="text-xl lg:text-2xl font-semibold bg-white/20 text-white">
                      {owner.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WishlistOwnerHero;
