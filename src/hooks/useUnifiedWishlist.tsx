
// Legacy compatibility wrapper for the new unified wishlist system
// @deprecated - Use useUnifiedWishlistSystem instead
import { useUnifiedWishlistSystem } from "./useUnifiedWishlistSystem";

interface ProductInfo {
  id: string;
  title?: string;
  name?: string;
  image?: string;
  price?: number;
  brand?: string;
}

export const useUnifiedWishlist = () => {
  const system = useUnifiedWishlistSystem();

  // Wrap the new system to maintain backward compatibility
  return {
    wishlists: system.wishlists,
    loading: system.loading,
    isProductWishlisted: system.isProductWishlisted,
    quickAddToWishlist: system.quickAddToWishlist,
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
    addToWishlist: async (wishlistId: string, item: any) => {
      try {
        await system.addToWishlist({ wishlistId, item });
        return true;
      } catch (error) {
        return false;
      }
    },
    ensureDefaultWishlist: system.getDefaultWishlist,
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
    handleWishlistToggle: system.handleWishlistToggle,
    wishlistedProducts: system.wishlistedProducts,
    updateWishlistSharing: async (wishlistId: string, isPublic: boolean) => {
      try {
        await system.updateWishlistSharing({ wishlistId, isPublic });
        return true;
      } catch (error) {
        return false;
      }
    },
  };
};
