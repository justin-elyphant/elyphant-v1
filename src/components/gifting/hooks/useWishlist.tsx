
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
    deleteWishlist: async () => false, // Placeholder
    updateWishlistSharing: async () => false, // Placeholder
    reloadWishlists: loadWishlists
  };
}
