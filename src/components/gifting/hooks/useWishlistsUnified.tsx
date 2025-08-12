// Unified wrapper for all wishlist operations
// This provides a single interface for all wishlist functionality
// @deprecated - Use useUnifiedWishlistSystem directly instead

import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

export function useWishlistsUnified() {
  const system = useUnifiedWishlistSystem();
  
  return {
    // Core data
    wishlists: system.wishlists,
    wishlistedProducts: system.wishlistedProducts,
    loading: system.loading,
    error: system.error,
    
    // State checks
    isProductWishlisted: system.isProductWishlisted,
    
    // CRUD operations with backward compatibility
    createWishlist: async (title: string, description?: string) => {
      try {
        return await system.createWishlist({ title, description });
      } catch (error) {
        console.error("Error creating wishlist:", error);
        return null;
      }
    },
    
    deleteWishlist: async (wishlistId: string) => {
      try {
        await system.deleteWishlist(wishlistId);
        return true;
      } catch (error) {
        console.error("Error deleting wishlist:", error);
        return false;
      }
    },
    
    addToWishlist: async (wishlistId: string, item: any) => {
      try {
        await system.addToWishlist({ wishlistId, item });
        return true;
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        return false;
      }
    },
    
    removeFromWishlist: async (wishlistId: string, itemId: string) => {
      try {
        await system.removeFromWishlist({ wishlistId, itemId });
        return true;
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        return false;
      }
    },
    
    updateWishlistSharing: async (wishlistId: string, isPublic: boolean) => {
      try {
        await system.updateWishlistSharing({ wishlistId, isPublic });
        return true;
      } catch (error) {
        console.error("Error updating wishlist sharing:", error);
        return false;
      }
    },
    
    // Convenience operations
    quickAddToWishlist: system.quickAddToWishlist,
    createWishlistWithItem: system.createWishlistWithItem,
    
    // Loading states
    isCreating: system.isCreating,
    isDeleting: system.isDeleting,
    isAdding: system.isAdding,
    isRemoving: system.isRemoving,
    isUpdatingSharing: system.isUpdatingSharing,
    
    // Refresh operations
    fetchWishlists: system.loadWishlists,
    loadWishlists: system.loadWishlists,
    reloadWishlists: system.loadWishlists,
    
    // Legacy compatibility
    handleWishlistToggle: system.handleWishlistToggle,
    ensureDefaultWishlist: system.getDefaultWishlist,
  };
}