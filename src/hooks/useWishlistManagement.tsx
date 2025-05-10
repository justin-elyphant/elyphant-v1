
import { useState, useCallback } from 'react';
import { useWishlist } from '@/components/gifting/hooks/useWishlist';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  price?: number;
  brand?: string;
  image_url?: string;
  added_at: string;
}

interface WishlistFormValues {
  title: string;
  description?: string;
}

export const useWishlistManagement = () => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isRemovingItem, setIsRemovingItem] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null);
  
  const {
    wishlists,
    createWishlist,
    deleteWishlist,
    updateWishlistSharing,
    addToWishlist,
    removeFromWishlist,
    isLoading,
    initError,
    reloadWishlists
  } = useWishlist();

  // Create new wishlist with proper feedback
  const handleCreateWishlist = useCallback(async (values: WishlistFormValues) => {
    try {
      const newWishlist = await createWishlist(values.title, values.description);
      if (newWishlist) {
        toast.success(`Wishlist "${values.title}" created`, {
          description: "You can now add products to your wishlist",
          action: {
            label: "View",
            onClick: () => navigate(`/wishlists`)
          }
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error creating wishlist:", err);
      toast.error("Failed to create wishlist");
      return false;
    }
  }, [createWishlist, navigate]);

  // Delete wishlist with confirmation
  const handleDeleteWishlist = useCallback(async (wishlistId: string, wishlistTitle: string) => {
    setIsDeleting(wishlistId);
    try {
      const success = await deleteWishlist(wishlistId);
      if (success) {
        toast.success(`Wishlist "${wishlistTitle}" deleted`);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting wishlist:", err);
      toast.error("Failed to delete wishlist");
      return false;
    } finally {
      setIsDeleting(null);
    }
  }, [deleteWishlist]);

  // Handle privacy toggle
  const handlePrivacyToggle = useCallback(async (wishlistId: string, isPublic: boolean) => {
    setIsEditing(wishlistId);
    try {
      const success = await updateWishlistSharing(wishlistId, isPublic);
      if (success) {
        toast.success(
          isPublic ? "Wishlist is now public" : "Wishlist is now private"
        );
      }
      return success;
    } catch (err) {
      console.error("Error updating privacy settings:", err);
      toast.error("Failed to update privacy settings");
      return false;
    } finally {
      setIsEditing(null);
    }
  }, [updateWishlistSharing]);

  // Add item to wishlist
  const handleAddToWishlist = useCallback(async (
    wishlistId: string, 
    product: {
      product_id: string;
      name: string;
      price?: number;
      image_url?: string;
      brand?: string;
    }
  ) => {
    setIsAddingItem(product.product_id);
    try {
      const success = await addToWishlist(wishlistId, product);
      if (success) {
        toast.success(`Added "${product.name}" to wishlist`);
      }
      return success;
    } catch (err) {
      console.error("Error adding item to wishlist:", err);
      toast.error("Failed to add item to wishlist");
      return false;
    } finally {
      setIsAddingItem(null);
    }
  }, [addToWishlist]);

  // Remove item from wishlist
  const handleRemoveFromWishlist = useCallback(async (
    wishlistId: string,
    itemId: string,
    itemName: string
  ) => {
    setIsRemovingItem(itemId);
    try {
      const success = await removeFromWishlist(wishlistId, itemId);
      if (success) {
        toast.success(`Removed "${itemName}" from wishlist`);
      }
      return success;
    } catch (err) {
      console.error("Error removing item from wishlist:", err);
      toast.error("Failed to remove item from wishlist");
      return false;
    } finally {
      setIsRemovingItem(null);
    }
  }, [removeFromWishlist]);

  return {
    wishlists,
    isLoading,
    initError,
    reloadWishlists,
    handleCreateWishlist,
    handleDeleteWishlist,
    handlePrivacyToggle,
    handleAddToWishlist,
    handleRemoveFromWishlist,
    isDeleting,
    isEditing,
    isRemovingItem,
    isAddingItem
  };
};
