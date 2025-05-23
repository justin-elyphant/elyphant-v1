import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";

// Core extracted logic for WishlistSelectionPopover
export const useWishlistPopoverLogic = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  onClose
}: {
  productId: string;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  onClose?: () => void;
}) => {
  const { wishlists, addToWishlist, createWishlist, reloadWishlists } = useWishlist();
  const [open, setOpen] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [localWishlists, setLocalWishlists] = useState(wishlists);

  // Always keep localWishlists in sync when opening
  useEffect(() => {
    if (open) {
      setLocalWishlists(wishlists);
    }
  }, [open, wishlists]);

  // Utility: Always reload, update, and return fresh wishlists
  const forceReloadLocalWishlists = async () => {
    const updated = await reloadWishlists();
    if (Array.isArray(updated) && updated.length > 0) {
      setLocalWishlists(updated);
      return updated;
    } else {
      setLocalWishlists(wishlists);
      return wishlists;
    }
  };

  const isInWishlist = (wishlistId: string) => {
    const wishlist = localWishlists.find((w) => w.id === wishlistId);
    return wishlist?.items.some((item) => item.product_id === productId);
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setAddingToWishlist(wishlistId);
      await addToWishlist(wishlistId, {
        product_id: productId,
        title: productName,
        wishlist_id: wishlistId,
        created_at: new Date().toISOString(),
        name: productName,
        price: productPrice,
        image_url: productImage,
        brand: productBrand
      });
      // << Sync backend + update localWishlists + wait for UI update
      const latest = await forceReloadLocalWishlists();
      // Small delay to ensure UI updates before closing (esp. on fast connections)
      setTimeout(() => {
        toast.success(`Added to wishlist`);
        if (onClose) onClose();
        setOpen(false);
        setAddingToWishlist(null);
      }, 350);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
      setAddingToWishlist(null);
    }
  };

  const handleCreateWishlist = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name for your wishlist");
      return;
    }
    setCreating(true);
    try {
      // 1. Create wishlist backend
      const newWishlist = await createWishlist(newName.trim());
      if (newWishlist) {
        // 2. Reload wishlists and update local
        const latestWishlists = await forceReloadLocalWishlists();
        // 3. Find newly created wishlist (ensure it's in the freshly loaded array)
        const created = latestWishlists.find(w => w.title === newName.trim());
        const newWishId = created?.id || newWishlist.id;
        if (newWishId) {
          // 4. Add product to the new wishlist, then sync again so item is counted
          await handleAddToWishlist(newWishId);
          await forceReloadLocalWishlists();
        } else {
          toast.error("Could not find the new wishlist after creation.");
        }
        setShowNewDialog(false);
        setNewName("");
      }
    } catch (err) {
      toast.error("Failed to create wishlist");
      setCreating(false);
    } finally {
      setCreating(false);
    }
  };

  return {
    wishlists: localWishlists,
    open,
    setOpen,
    addingToWishlist,
    setAddingToWishlist,
    showNewDialog,
    setShowNewDialog,
    newName,
    setNewName,
    creating,
    setCreating,
    isInWishlist,
    handleAddToWishlist,
    handleCreateWishlist
  };
};
