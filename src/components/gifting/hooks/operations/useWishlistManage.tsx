import { useState } from "react";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";

export function useWishlistManage(
  setWishlists: (wishlists: Wishlist[]) => void,
  setWishlistedProducts: (products: string[]) => void,
  syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<void>,
  updateWishlistSharingSettings?: (wishlistId: string, isPublic: boolean) => Promise<boolean>
) {
  const [deletingWishlist, setDeletingWishlist] = useState<string | null>(null);
  const [updatingWishlist, setUpdatingWishlist] = useState<string | null>(null);
  
  // Delete wishlist and sync with profile
  const deleteWishlist = async (wishlistId: string): Promise<boolean> => {
    try {
      setDeletingWishlist(wishlistId);
      
      // Get current state
      let wishlists: Wishlist[] = [];
      
      // Update state with optimistic deletion
      setWishlists((prevWishlists) => {
        // Filter out deleted wishlist
        const filtered = prevWishlists.filter((list) => list.id !== wishlistId);
        wishlists = filtered; // Store updated list for sync
        return filtered;
      });
      
      // Update wishlistedProducts to remove products that are only in this list
      const removedWishlist = wishlists.find((list) => list.id === wishlistId);
      if (removedWishlist?.items) {
        // Get product IDs from deleted wishlist
        const deletedProductIds = removedWishlist.items.map((item) => item.product_id);
        
        // Create a set of all product IDs still in other wishlists
        const remainingProductIds = new Set(
          wishlists.flatMap((list) => list.items.map((item) => item.product_id))
        );
        
        // Filter out product IDs that are no longer in any wishlist
        setWishlistedProducts((prevProducts) =>
          prevProducts.filter((productId) => remainingProductIds.has(productId))
        );
      }
      
      // Sync updated wishlists with profile
      await syncWishlistToProfile(wishlists);
      
      return true;
    } catch (err) {
      console.error("Error deleting wishlist:", err);
      
      // Show error notification
      toast.error("Failed to delete wishlist", {
        description: "An error occurred while deleting your wishlist."
      });
      
      return false;
    } finally {
      setDeletingWishlist(null);
    }
  };
  
  // Update wishlist sharing settings
  const updateWishlistSharing = async (
    wishlistId: string, 
    isPublic: boolean
  ): Promise<boolean> => {
    try {
      setUpdatingWishlist(wishlistId);
      
      // If we have the external function from props, use it
      if (updateWishlistSharingSettings) {
        return await updateWishlistSharingSettings(wishlistId, isPublic);
      }
      
      // Otherwise, update locally
      let success = false;
      
      setWishlists((prevWishlists) => {
        const updatedWishlists = prevWishlists.map((list) => {
          if (list.id === wishlistId) {
            return { ...list, is_public: isPublic };
          }
          return list;
        });
        
        success = true;
        
        // Sync with profile
        syncWishlistToProfile(updatedWishlists).catch((err) => {
          console.error("Error syncing wishlist privacy settings:", err);
          success = false;
        });
        
        return updatedWishlists;
      });
      
      return success;
    } catch (err) {
      console.error("Error updating wishlist sharing settings:", err);
      return false;
    } finally {
      setUpdatingWishlist(null);
    }
  };
  
  // Update wishlist details
  const updateWishlistDetails = async (
    wishlistId: string,
    updates: Partial<Wishlist>
  ): Promise<boolean> => {
    try {
      setUpdatingWishlist(wishlistId);
      
      let updatedWishlists: Wishlist[] = [];
      
      setWishlists((prevWishlists) => {
        const newWishlists = prevWishlists.map((list) => {
          if (list.id === wishlistId) {
            // Prevent overwriting certain fields
            const { id, items, is_public, created_at, ...allowedUpdates } = updates;
            
            // Merge updates with existing wishlist
            return {
              ...list,
              ...allowedUpdates,
              updated_at: new Date().toISOString()
            };
          }
          return list;
        });
        
        updatedWishlists = newWishlists;
        return newWishlists;
      });
      
      // Sync with profile
      await syncWishlistToProfile(updatedWishlists);
      
      toast.success("Wishlist updated successfully", {
        description: "Your changes have been saved."
      });
      
      return true;
    } catch (err) {
      console.error("Error updating wishlist details:", err);
      
      toast.error("Failed to update wishlist", {
        description: "An error occurred while saving your changes."
      });
      
      return false;
    } finally {
      setUpdatingWishlist(null);
    }
  };
  
  // Toggle wishlist item between wishlists
  const handleWishlistToggle = async (productId: string): Promise<boolean> => {
    // This function can be implemented if needed for cross-wishlist functionality
    return true;
  };
  
  return {
    deleteWishlist,
    updateWishlistSharing,
    updateWishlistDetails,
    handleWishlistToggle,
    deletingWishlist,
    updatingWishlist
  };
}
