import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, EyeOff, Share2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface WishlistActionToolbarProps {
  wishlistId: string;
  ownerId: string;
  ownerName: string;
  isOwner: boolean;
  isGuestPreview: boolean;
  onToggleGuestPreview: () => void;
  onAddItems: () => void;
}

const WishlistActionToolbar = ({
  wishlistId,
  ownerId,
  ownerName,
  isOwner,
  isGuestPreview,
  onToggleGuestPreview,
  onAddItems
}: WishlistActionToolbarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handlePreviewAsGuest = () => {
    // Navigate to the public profile view to see actual guest experience
    navigate(`/profile/${ownerId}`);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${ownerId}?wishlist=${wishlistId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ownerName}'s Wishlist`,
          text: `Check out my wishlist on Elyphant! 🎁`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Wishlist link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleSettings = () => {
    toast.info("Settings coming soon!");
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pb-6 border-b">
        <div className="flex items-center gap-2">
          {!isGuestPreview && (
            <Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md">
              <Plus className="h-5 w-5" />
              {!isMobile && "Add Items"}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handlePreviewAsGuest}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {!isMobile && "Preview as Guest"}
          </Button>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Guest Preview Banner (if toggled inline) */}
      {isGuestPreview && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <Eye className="inline h-4 w-4 mr-2" />
              Viewing as guest
            </p>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onToggleGuestPreview}
              className="gap-2"
            >
              <EyeOff className="h-4 w-4" />
              Exit Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistActionToolbar;
