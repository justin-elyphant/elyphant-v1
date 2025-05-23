
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

      await reloadWishlists();
      setLocalWishlists(wishlists => wishlists);

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
        await reloadWishlists();
        const refreshed = await reloadWishlists();
        let created = null;
        if (Array.isArray(refreshed)) {
          created = refreshed.find(w => w.title === newName.trim());
        } else {
          created = (wishlists || []).find(w => w.title === newName.trim());
        }
        const newWishId = created?.id || newWishlist.id;
        if (newWishId) {
          await handleAddToWishlist(newWishId);
          await reloadWishlists();
          setLocalWishlists(wishlists => wishlists);
        } else {
          toast.error("Could not find the new wishlist after creation.");
        }
        setShowNewDialog(false);
        setNewName("");
      }
    } catch (err) {
      toast.error("Failed to create wishlist");
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
