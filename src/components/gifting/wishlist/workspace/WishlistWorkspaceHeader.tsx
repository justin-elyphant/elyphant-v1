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
    <div className="border-b border-border bg-background shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Back button and wishlist switcher */}
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wishlists')}
            className="gap-2 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobileOrTablet && "Back to Wishlists"}
          </Button>
          
          <WishlistSwitcher currentWishlistId={wishlist.id} currentWishlistTitle={wishlist.title} />
        </div>

        {/* Main header content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Profile and info */}
          <div className="flex items-center gap-3 md:gap-4">
            {ownerProfile?.image ? (
              <img 
                src={ownerProfile.image} 
                alt={ownerProfile.name || "Owner"} 
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <span className="text-xl lg:text-2xl font-semibold text-muted-foreground">
                  {ownerProfile?.name?.charAt(0) || 'W'}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl lg:text-2xl font-bold truncate">{wishlist.title}</h1>
                
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
              
              <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground flex-wrap">
                <span>{wishlist.items.length} items</span>
                <span>•</span>
                <span>${totalValue.toFixed(2)} total</span>
                {wishlist.category && (
                  <>
                    <span className="hidden lg:inline">•</span>
                    <span className="hidden lg:inline capitalize">{wishlist.category}</span>
                  </>
                )}
              </div>
              
              {wishlist.description && !isMobileOrTablet && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{wishlist.description}</p>
              )}
            </div>
          </div>

          {/* Right: Actions - Desktop only (mobile/tablet uses action bar) */}
          {isOwner && !isMobileOrTablet && (
            <div className="flex items-center gap-2">
              <Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md bg-elyphant-gradient text-white hover:opacity-90">
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
  );
};

export default WishlistWorkspaceHeader;
