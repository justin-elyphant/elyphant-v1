
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

  useEffect(() => {
    if (open) {
      setLocalWishlists(wishlists);
    }
  }, [open, wishlists]);

  // --- Helper to fully re-sync wishlists and set local state
  const forceReloadLocalWishlists = async () => {
    const updated = await reloadWishlists();
    // backward compatible: await returns wishlists (if designed), else use context
    if (Array.isArray(updated)) {
      setLocalWishlists(updated);
    } else {
      setLocalWishlists(wishlists);
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

      await forceReloadLocalWishlists(); // Strong guarantee of state update

      toast.success(`Added to wishlist`);
      if (onClose) onClose();
      setOpen(false);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    } finally {
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
      const newWishlist = await createWishlist(newName.trim());
      if (newWishlist) {
        // Force reload all wishlists to find the correct, latest one
        await forceReloadLocalWishlists();

        // Try to find the new wishlist and add product into it
        const syncedLists = localWishlists.length > 0 ? localWishlists : (wishlists || []);
        const created = syncedLists.find(w => w.title === newName.trim());
        const newWishId = created?.id || newWishlist.id;

        if (newWishId) {
          await handleAddToWishlist(newWishId);
          // After product added, re-sync everything
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
