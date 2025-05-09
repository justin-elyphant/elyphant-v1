
import { useWishlistOperations } from "./useWishlistOperations";

export function useWishlist() {
  const {
    wishlistedProducts,
    wishlists,
    isInitialized,
    isLoading,
    initError,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist,
    updateWishlistSharing,
    reloadWishlists
  } = useWishlistOperations();

  return {
    wishlistedProducts,
    wishlists,
    isInitialized,
    isLoading,
    initError,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist,
    updateWishlistSharing,
    reloadWishlists
  };
}
