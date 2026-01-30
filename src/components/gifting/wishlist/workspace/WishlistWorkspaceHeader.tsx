import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import WishlistSwitcher from "../navigation/WishlistSwitcher";
import InlinePrivacyToggle from "../share/InlinePrivacyToggle";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";
import { getWishlistShareUrl } from "@/utils/urlUtils";

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

  return (
    <div className="border-b border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Back button only - minimal top row */}
        <div className="flex items-center gap-3 py-3 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wishlists')}
            className="gap-2 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobileOrTablet && "Back to Wishlists"}
          </Button>
        </div>

        {/* Hero Banner Section - Large avatar and title */}
        <div className="py-8 md:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
            {/* Left: Large Profile and info */}
            <div className="flex items-center gap-4 md:gap-6">
              {ownerProfile?.image ? (
                <img 
                  src={ownerProfile.image} 
                  alt={ownerProfile.name || "Owner"} 
                  className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover border-4 border-border shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-muted flex items-center justify-center border-4 border-border shadow-lg">
                  <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-muted-foreground">
                    {ownerProfile?.name?.charAt(0) || 'W'}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">{wishlist.title}</h1>
                  
                  {/* Privacy Toggle - Desktop only (mobile/tablet uses action bar) */}
                  {isOwner && !isMobileOrTablet && onPrivacyToggle && (
                    <InlinePrivacyToggle
                      isPublic={currentIsPublic}
                      onToggle={onPrivacyToggle}
                      isUpdating={isUpdatingPrivacy}
                      size="sm"
                    />
                  )}
                </div>
                
                <div className="flex items-center gap-3 lg:gap-4 text-sm lg:text-base text-muted-foreground flex-wrap">
                  <span className="font-medium">{wishlist.items.length} items</span>
                  <span>•</span>
                  <span className="font-medium">${totalValue.toFixed(2)} total</span>
                  {wishlist.category && (
                    <>
                      <span className="hidden lg:inline">•</span>
                      <span className="hidden lg:inline capitalize">{wishlist.category}</span>
                    </>
                  )}
                </div>
                
                {wishlist.description && !isMobileOrTablet && (
                  <p className="text-base text-muted-foreground mt-3 max-w-xl">{wishlist.description}</p>
                )}
              </div>
            </div>

            {/* Right: Actions - Desktop only (mobile/tablet uses action bar) */}
            {isOwner && !isMobileOrTablet && (
              <div className="flex items-center gap-3">
                <Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md bg-elyphant-gradient text-white hover:opacity-90 px-6">
                  <Plus className="h-5 w-5" />
                  Add Items
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistWorkspaceHeader;
