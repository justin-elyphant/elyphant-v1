import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Eye, EyeOff, Share2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import { useIsMobile } from "@/hooks/use-mobile";
import WishlistSwitcher from "../navigation/WishlistSwitcher";
import InlinePrivacyToggle from "../share/InlinePrivacyToggle";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

interface WishlistWorkspaceHeaderProps {
  wishlist: Wishlist;
  ownerProfile: { name?: string; image?: string; id: string } | null;
  isOwner: boolean;
  isGuestPreview: boolean;
  onToggleGuestPreview: () => void;
  onAddItems: () => void;
  isPublic?: boolean;
  isUpdatingPrivacy?: boolean;
  onPrivacyToggle?: () => void;
  onShare?: () => void;
}

const WishlistWorkspaceHeader = ({
  wishlist,
  ownerProfile,
  isOwner,
  isGuestPreview,
  onToggleGuestPreview,
  onAddItems,
  isPublic,
  isUpdatingPrivacy = false,
  onPrivacyToggle,
  onShare
}: WishlistWorkspaceHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const totalValue = wishlist.items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleShare = async () => {
    await triggerHapticFeedback('light');
    
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      const shareUrl = `${window.location.origin}/wishlist/${wishlist.id}`;
      
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

  // Use prop if provided, otherwise fall back to wishlist.is_public
  const currentIsPublic = isPublic !== undefined ? isPublic : wishlist.is_public;

  return (
    <div className="border-b border-border bg-gradient-to-r from-background via-primary/5 to-background shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Back button and wishlist switcher */}
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wishlists')}
            className="gap-2 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobile && "Back to Wishlists"}
          </Button>
          
          {/* Wishlist Switcher */}
          <WishlistSwitcher currentWishlistId={wishlist.id} currentWishlistTitle={wishlist.title} />
        </div>

        {/* Main header content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Profile and info */}
          <div className="flex items-center gap-3 md:gap-4">
            {ownerProfile?.image ? (
              <img 
                src={ownerProfile.image} 
                alt={ownerProfile.name || "Owner"} 
                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                <span className="text-xl md:text-2xl font-semibold text-primary">
                  {ownerProfile?.name?.charAt(0) || 'W'}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold truncate">{wishlist.title}</h1>
                
                {/* Inline Privacy Toggle for owner (desktop/tablet) */}
                {isOwner && !isMobile && onPrivacyToggle && (
                  <InlinePrivacyToggle
                    isPublic={currentIsPublic}
                    onToggle={onPrivacyToggle}
                    isUpdating={isUpdatingPrivacy}
                    size="sm"
                  />
                )}
              </div>
              
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground flex-wrap">
                <span>{wishlist.items.length} items</span>
                <span>•</span>
                <span>${totalValue.toFixed(2)} total</span>
                {wishlist.category && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline capitalize">{wishlist.category}</span>
                  </>
                )}
              </div>
              
              {wishlist.description && !isMobile && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{wishlist.description}</p>
              )}
            </div>
          </div>

          {/* Right: Actions - Hidden on mobile (action bar handles this) */}
          {isOwner && !isMobile && (
            <div className="flex items-center gap-2">
              {!isGuestPreview && (
                <Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md">
                  <Plus className="h-5 w-5" />
                  Add Items
                </Button>
              )}
              
              <Button
                variant={isGuestPreview ? "default" : "outline"}
                onClick={onToggleGuestPreview}
                className="gap-2 min-h-[44px]"
              >
                {isGuestPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Exit Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview as Guest
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleShare}
                className="min-h-[44px] min-w-[44px]"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Guest Preview Banner */}
        {isOwner && isGuestPreview && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center">
              <Eye className="inline h-4 w-4 mr-2" />
              You're viewing this wishlist as your guests would see it
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistWorkspaceHeader;
