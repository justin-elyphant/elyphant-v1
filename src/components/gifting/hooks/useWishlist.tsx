
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

export function useWishlist() {
  const {
    wishlists,
    loading,
    wishlistedProducts,
    loadWishlists,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    isProductWishlisted,
    quickAddToWishlist
  } = useUnifiedWishlist();

  // Map the unified wishlist interface to the expected useWishlist interface
  return {
    wishlistedProducts,
    wishlists,
    isInitialized: !loading,
    isLoading: loading,
    initError: null,
    handleWishlistToggle: quickAddToWishlist,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist: async () => false, // Placeholder - will implement if needed
    updateWishlistSharing: async () => false, // Placeholder - will implement if needed
    reloadWishlists: loadWishlists,
    // Add these to ensure proper sync
    isProductWishlisted,
    refreshWishlists: loadWishlists
  };
}
