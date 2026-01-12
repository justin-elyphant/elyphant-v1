import React from "react";
import { Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import InlinePrivacyToggle from "../share/InlinePrivacyToggle";
import { triggerHapticFeedback } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface MobileWishlistActionBarProps {
  wishlist: Wishlist;
  isPublic: boolean;
  isUpdatingPrivacy: boolean;
  onPrivacyToggle: () => void;
  onShare: () => void;
  onAddItems: () => void;
  className?: string;
}

const MobileWishlistActionBar = ({
  wishlist,
  isPublic,
  isUpdatingPrivacy,
  onPrivacyToggle,
  onShare,
  onAddItems,
  className
}: MobileWishlistActionBarProps) => {
  const handleShare = async () => {
    await triggerHapticFeedback('light');
    onShare();
  };

  const handleAddItems = async () => {
    await triggerHapticFeedback('medium');
    onAddItems();
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-[70]",
        "bg-background/95 backdrop-blur-xl",
        "border-t border-border/50",
        "shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]",
        className
      )}
      style={{
        // Position ABOVE the bottom navigation (nav is ~80px + safe area)
        bottom: 'calc(80px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Privacy Toggle */}
        <InlinePrivacyToggle
          isPublic={isPublic}
          onToggle={onPrivacyToggle}
          isUpdating={isUpdatingPrivacy}
          size="md"
        />

        {/* Share Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleShare}
          className="min-h-[44px] min-w-[44px] gap-2 flex-1 max-w-[140px]"
        >
          <Share2 className="h-5 w-5" />
          Share
        </Button>

        {/* Add Items FAB */}
        <Button
          size="lg"
          onClick={handleAddItems}
          className="min-h-[44px] gap-2 flex-1 font-semibold shadow-md"
        >
          <Plus className="h-5 w-5" />
          Add Items
        </Button>
      </div>
    </div>
  );
};

export default MobileWishlistActionBar;
