import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Plus } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import InlinePrivacyToggle from "../share/InlinePrivacyToggle";
import WishlistShareSheet from "../share/WishlistShareSheet";
import { Wishlist } from "@/types/profile";

interface MobileWishlistActionBarProps {
  wishlist: Wishlist;
  isPublic: boolean;
  onPrivacyToggle: () => void;
  onAddItems: () => void;
}

const MobileWishlistActionBar = ({
  wishlist,
  isPublic,
  onPrivacyToggle,
  onAddItems,
}: MobileWishlistActionBarProps) => {
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const handleShare = () => {
    triggerHapticFeedback('light');
    setShareSheetOpen(true);
  };

  const handleAddItems = () => {
    triggerHapticFeedback('light');
    onAddItems();
  };

  return (
    <>
      <div 
        className={cn(
          "fixed left-0 right-0 z-40",
          "bg-background/95 backdrop-blur-lg border-t",
          "px-3 py-2"
        )}
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Privacy Toggle - Compact */}
          <InlinePrivacyToggle
            isPublic={isPublic}
            onToggle={onPrivacyToggle}
            size="sm"
          />

          {/* Share Button */}
          <Button
            variant="outline"
            size="default"
            className="min-h-[44px] min-w-[44px] gap-1.5"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden xs:inline">Share</span>
          </Button>

          {/* Add Items Button */}
          <Button
            size="default"
            className="min-h-[44px] gap-1.5 flex-1 max-w-[140px]"
            onClick={handleAddItems}
          >
            <Plus className="h-4 w-4" />
            Add Items
          </Button>
        </div>
      </div>

      {/* Share Sheet */}
      <WishlistShareSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        wishlist={wishlist}
      />
    </>
  );
};

export default MobileWishlistActionBar;
