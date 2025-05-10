
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
import { AlertTriangle } from "lucide-react";

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
        toast.success(
          isPublic 
            ? "Wishlist is now public and can be shared" 
            : "Wishlist is now private"
        );
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

  const getPrivacyLabel = (): string => {
    return currentStatus ? "Public" : "Private";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Share Wishlist
              <ShareStatusBadge isPublic={currentStatus} size="sm" />
            </DialogTitle>
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
                  <AlertTriangle className="h-5 w-5" />
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
        
        <div className="mt-2 flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWishlistDialog;
