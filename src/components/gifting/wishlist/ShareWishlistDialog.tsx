
import React from "react";
import { Wishlist } from "@/types/profile";
import ShareWishlistContainer from "./share/ShareWishlistContainer";

interface ShareWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

// This is just a wrapper component that imports from the refactored components
const ShareWishlistDialog = (props: ShareWishlistDialogProps) => {
  return <ShareWishlistContainer {...props} />;
};

export default ShareWishlistDialog;
