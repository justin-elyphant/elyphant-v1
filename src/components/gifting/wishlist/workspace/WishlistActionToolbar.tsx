import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, EyeOff, Share2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { getProfileUrl } from "@/utils/urlUtils";

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
    const shareUrl = getProfileUrl(ownerId, wishlistId);
    
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
      {/* Guest Preview Banner */}
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
