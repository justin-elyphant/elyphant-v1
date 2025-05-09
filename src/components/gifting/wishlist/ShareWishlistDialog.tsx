
import React from "react";
import { Wishlist } from "@/types/profile";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ShareWishlistOptions from "./share/ShareWishlistOptions";
import PrivacyToggle from "./share/PrivacyToggle";
import { toast } from "sonner";

interface ShareWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const ShareWishlistDialog = ({ 
  open, 
  onOpenChange, 
  wishlist, 
  onShareSettingsChange 
}: ShareWishlistDialogProps) => {
  if (!wishlist) return null;

  const handlePrivacyToggle = async (isPublic: boolean) => {
    try {
      const success = await onShareSettingsChange(wishlist.id, isPublic);
      if (success) {
        toast.success(`Wishlist is now ${isPublic ? 'public' : 'private'}`);
      }
    } catch (error) {
      console.error("Failed to update wishlist privacy:", error);
      toast.error("Failed to update sharing settings");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Wishlist</DialogTitle>
          <DialogDescription>
            Share your wishlist with friends or make it public for anyone to view
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <PrivacyToggle 
            isPublic={wishlist.is_public} 
            onToggle={handlePrivacyToggle} 
          />
          
          {wishlist.is_public && (
            <ShareWishlistOptions wishlistId={wishlist.id} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWishlistDialog;
