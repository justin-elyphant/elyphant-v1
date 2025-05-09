
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import SharingOptions from "./SharingOptions";
import PrivacyToggle from "./PrivacyToggle";

interface ShareWishlistContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const ShareWishlistContainer = ({
  open,
  onOpenChange,
  wishlist,
  onShareSettingsChange,
}: ShareWishlistContainerProps) => {
  const [isPublic, setIsPublic] = useState(wishlist?.is_public || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens/closes or wishlist changes
  useEffect(() => {
    if (open && wishlist) {
      setIsPublic(wishlist.is_public);
    }
  }, [open, wishlist]);

  const handleSaveSettings = async () => {
    if (!wishlist) return;
    
    setIsSubmitting(true);
    try {
      const success = await onShareSettingsChange(wishlist.id, isPublic);
      
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating wishlist sharing settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Wishlist</DialogTitle>
          <DialogDescription>
            Share your wishlist "{wishlist?.title}" with friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <PrivacyToggle isPublic={isPublic} onToggle={setIsPublic} />
          <SharingOptions isPublic={isPublic} wishlistId={wishlist?.id || ""} />
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWishlistContainer;
