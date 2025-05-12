import { useState } from "react";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";

export function useWishlistManage(
  setWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>,
  setWishlistedProducts: React.Dispatch<React.SetStateAction<string[]>>,
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
      let updatedWishlists: Wishlist[] = [];
      let removedWishlist: Wishlist | undefined;
      
      // Update state with optimistic deletion
      setWishlists((prevWishlists) => {
        // Get the wishlist being removed before filtering
        removedWishlist = prevWishlists.find((list) => list.id === wishlistId);
        
        // Filter out deleted wishlist
        updatedWishlists = prevWishlists.filter((list) => list.id !== wishlistId);
        return updatedWishlists;
      });
      
      // Update wishlistedProducts to remove products that are only in this list
      if (removedWishlist?.items) {
        // Get product IDs from deleted wishlist
        const deletedProductIds = removedWishlist.items.map((item) => item.product_id);
        
        // Create a set of all product IDs still in other wishlists
        const remainingProductIds = new Set(
          updatedWishlists.flatMap((list) => list.items.map((item) => item.product_id))
        );
        
        // Filter out product IDs that are no longer in any wishlist
        setWishlistedProducts((prevProducts) =>
          prevProducts.filter((productId) => remainingProductIds.has(productId))
        );
      }
      
      // Sync updated wishlists with profile
      await syncWishlistToProfile(updatedWishlists);
      
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
      let updatedWishlists: Wishlist[] = [];
      
      setWishlists((prevWishlists) => {
        updatedWishlists = prevWishlists.map((list) => {
          if (list.id === wishlistId) {
            return { ...list, is_public: isPublic };
          }
          return list;
        });
        
        return updatedWishlists;
      });
      
      // Sync with profile
      await syncWishlistToProfile(updatedWishlists);
      return true;
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
        updatedWishlists = prevWishlists.map((list) => {
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
        
        return updatedWishlists;
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
