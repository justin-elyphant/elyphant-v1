
import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import ShareWishlistOptions from "./share/ShareWishlistOptions";
import PrivacyToggle from "./share/PrivacyToggle";
import ShareStatusBadge from "./ShareStatusBadge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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
  const [isChangingPrivacy, setIsChangingPrivacy] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<boolean>(false);
  
  useEffect(() => {
    if (wishlist) {
      setCurrentStatus(wishlist.is_public);
    }
  }, [wishlist, open]);

  if (!wishlist) return null;

  const handlePrivacyToggle = async (isPublic: boolean) => {
    try {
      setIsChangingPrivacy(true);
      setCurrentStatus(isPublic); // Optimistically update UI

      const success = await onShareSettingsChange(wishlist.id, isPublic);
      
      if (success) {
        toast.success(`Wishlist is now ${isPublic ? 'public' : 'private'}`);
      } else {
        // Revert UI if failed
        setCurrentStatus(!isPublic);
        toast.error("Failed to update sharing settings");
      }
    } catch (error) {
      console.error("Failed to update wishlist privacy:", error);
      setCurrentStatus(!isPublic); // Revert UI
      toast.error("Failed to update sharing settings");
    } finally {
      setIsChangingPrivacy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Share Wishlist</DialogTitle>
            <ShareStatusBadge isPublic={currentStatus} />
          </div>
          <DialogDescription>
            Share "{wishlist.title}" with friends or make it public for anyone to view
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <PrivacyToggle 
            isPublic={currentStatus} 
            onToggle={handlePrivacyToggle}
            disabled={isChangingPrivacy} 
          />
          
          <Separator />
          
          {currentStatus ? (
            <ShareWishlistOptions wishlistId={wishlist.id} />
          ) : (
            <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="text-amber-800 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Private Wishlist</h3>
                  <div className="mt-1 text-sm text-amber-700">
                    <p>Your wishlist is currently private and cannot be shared.</p>
                    <p className="mt-1">Toggle the privacy setting above to make your wishlist public and shareable.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWishlistDialog;
