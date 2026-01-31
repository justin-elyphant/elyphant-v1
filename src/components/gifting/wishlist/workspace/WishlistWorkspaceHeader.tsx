import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Share2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wishlist } from "@/types/profile";
import InlinePrivacyToggle from "../share/InlinePrivacyToggle";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";
import { getWishlistShareUrl } from "@/utils/urlUtils";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";

interface WishlistWorkspaceHeaderProps {
  wishlist: Wishlist;
  ownerProfile: { name?: string; image?: string; id: string } | null;
  isOwner: boolean;
  onAddItems: () => void;
  isPublic?: boolean;
  isUpdatingPrivacy?: boolean;
  onPrivacyToggle?: () => void;
  onShare?: () => void;
  isMobileOrTablet?: boolean;
}

const WishlistWorkspaceHeader = ({
  wishlist,
  ownerProfile,
  isOwner,
  onAddItems,
  isPublic,
  isUpdatingPrivacy = false,
  onPrivacyToggle,
  onShare,
  isMobileOrTablet = false
}: WishlistWorkspaceHeaderProps) => {
  const navigate = useNavigate();

  const totalValue = wishlist.items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleShare = async () => {
    await triggerHapticFeedback('light');
    
    if (onShare) {
      onShare();
    } else {
      const shareUrl = getWishlistShareUrl(wishlist.id);
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: wishlist.title,
            text: `Check out my wishlist "${wishlist.title}" on Elyphant!`,
            url: shareUrl
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard!");
          }
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const currentIsPublic = isPublic !== undefined ? isPublic : wishlist.is_public;
  const userInitials = ownerProfile?.name?.charAt(0).toUpperCase() || 'W';

  return (
    <>
      {/* Gradient Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-sky-500">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Back button */}
          <div className="mb-4 lg:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/wishlists')}
              className="text-white/90 hover:text-white hover:bg-white/10 gap-2 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobileOrTablet && "Back to Wishlists"}
            </Button>
          </div>

          {/* Main header content */}
          <div className="flex items-start gap-4 lg:gap-6">
            {/* Avatar */}
            <Avatar className="h-16 w-16 lg:h-24 lg:w-24 border-4 border-white/20 shadow-xl flex-shrink-0">
              <AvatarImage src={ownerProfile?.image} alt={ownerProfile?.name || 'Owner'} />
              <AvatarFallback className="text-xl lg:text-3xl bg-white/20 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {/* Title & metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 lg:gap-3 flex-wrap mb-1 lg:mb-2">
                <h1 className="text-xl lg:text-3xl font-bold text-white truncate">
                  {wishlist.title}
                </h1>
                
                {/* Public/Private Badge */}
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white border-0 backdrop-blur-sm gap-1.5"
                >
                  {currentIsPublic ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Private
                    </>
                  )}
                </Badge>
              </div>

              {/* Stats line */}
              <p className="text-white/80 text-sm lg:text-base">
                {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
                {totalValue > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    {formatPrice(totalValue)} total
                  </>
                )}
              </p>

              {/* Description - Desktop only */}
              {wishlist.description && !isMobileOrTablet && (
                <p className="text-white/70 mt-2 text-sm max-w-xl line-clamp-2">
                  {wishlist.description}
                </p>
              )}
            </div>

            {/* Action buttons - Desktop only */}
            {isOwner && !isMobileOrTablet && (
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onAddItems}
                    className="h-11 px-6 bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Items
                  </Button>
                </motion.div>
                
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-11 w-11 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WishlistWorkspaceHeader;
