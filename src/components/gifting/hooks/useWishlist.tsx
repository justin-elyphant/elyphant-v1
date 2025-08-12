
// Unified wishlist hook - now delegates to the new system
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

export function useWishlist() {
  const system = useUnifiedWishlistSystem();
  
  // Create the missing handleWishlistToggle method
  const handleWishlistToggle = async (productId: string, product?: any) => {
    if (!product) return false;
    
    // Check if product is already in any wishlist
    const isCurrentlyWishlisted = system.isProductWishlisted(productId);
    
    if (isCurrentlyWishlisted) {
      // Find the wishlist item and remove it
      for (const wishlist of system.wishlists) {
        const item = wishlist.items?.find(item => item.product_id === productId);
        if (item) {
          try {
            await system.removeFromWishlist({ wishlistId: wishlist.id, itemId: item.id });
            return true;
          } catch (error) {
            return false;
          }
        }
      }
      return false;
    } else {
      // Add to wishlist using quickAddToWishlist
      return await system.quickAddToWishlist(product);
    }
  };

  // Create the missing updateWishlistSharing method
  const updateWishlistSharing = async (wishlistId: string, isPublic: boolean) => {
    try {
      await system.updateWishlistSharing({ wishlistId, isPublic });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    wishlists: system.wishlists,
    wishlistedProducts: system.wishlistedProducts,
    loading: system.loading,
    error: system.error,
    isProductWishlisted: system.isProductWishlisted,
    quickAddToWishlist: system.quickAddToWishlist,
    createWishlist: async (title: string, description?: string) => {
      try {
        return await system.createWishlist({ title, description });
      } catch (error) {
        return null;
      }
    },
    deleteWishlist: async (wishlistId: string) => {
      try {
        await system.deleteWishlist(wishlistId);
        return true;
      } catch (error) {
        return false;
      }
    },
    addToWishlist: async (wishlistId: string, item: any) => {
      try {
        await system.addToWishlist({ wishlistId, item });
        return true;
      } catch (error) {
        return false;
      }
    },
    removeFromWishlist: async (wishlistId: string, itemId: string) => {
      try {
        await system.removeFromWishlist({ wishlistId, itemId });
        return true;
      } catch (error) {
        return false;
      }
    },
    createWishlistWithItem: system.createWishlistWithItem,
    loadWishlists: system.loadWishlists,
    handleWishlistToggle,
    updateWishlistSharing,
    reloadWishlists: system.loadWishlists,
    
    // Loading states
    isCreating: system.isCreating,
    isDeleting: system.isDeleting,
    isAdding: system.isAdding,
    isRemoving: system.isRemoving,
    isUpdatingSharing: system.isUpdatingSharing,
  };
}
