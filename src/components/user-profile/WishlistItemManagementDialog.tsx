import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Heart, ExternalLink, ShoppingCart } from "lucide-react";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface WishlistItemManagementDialogProps {
  item: {
    id: string;
    product_id?: string;
    name?: string;
    title?: string;
    price?: number;
    image_url?: string;
    product_url?: string;
    wishlist_id?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemRemoved?: () => void;
}

const WishlistItemManagementDialog: React.FC<WishlistItemManagementDialogProps> = ({
  item,
  open,
  onOpenChange,
  onItemRemoved,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { removeFromWishlist, wishlists } = useUnifiedWishlistSystem();

  if (!item) return null;

  const itemName = item.name || item.title || "Unknown Item";
  const itemPrice = item.price || 0;
  const itemImage = item.image_url || "/placeholder.svg";

  // Find which wishlist this item belongs to
  const parentWishlist = wishlists.find(wishlist =>
    wishlist.items?.some(wishlistItem => wishlistItem.id === item.id)
  );

  const handleRemoveFromWishlist = async () => {
    if (!parentWishlist || !item.id) {
      toast.error("Could not find wishlist information for this item.");
      return;
    }

    setIsRemoving(true);
    try {
      await removeFromWishlist({
        wishlistId: parentWishlist.id,
        itemId: item.id,
      });

      toast.success(`"${itemName}" has been removed from your wishlist.`);

      onOpenChange(false);
      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      toast.error("Failed to remove item from wishlist. Please try again.");
    } finally {
      setIsRemoving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewProduct = () => {
    if (item.product_url) {
      window.open(item.product_url, '_blank');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Wishlist Item</DialogTitle>
            <DialogDescription>
              Manage this item from your wishlist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Item Preview */}
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={itemImage}
                  alt={itemName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg line-clamp-2">{itemName}</h3>
                {itemPrice > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {formatPrice(itemPrice)}
                  </Badge>
                )}
                {parentWishlist && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>In "{parentWishlist.title}"</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {item.product_url && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleViewProduct}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Product Details
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isRemoving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Wishlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item from Wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{itemName}" from your wishlist? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromWishlist}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WishlistItemManagementDialog;