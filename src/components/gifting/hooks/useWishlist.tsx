
import { useWishlistOperations } from "./useWishlistOperations";

export function useWishlist() {
  const {
    wishlistedProducts,
    wishlists,
    isInitialized,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist
  } = useWishlistOperations();

  return {
    wishlistedProducts,
    wishlists,
    isInitialized,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist
  };
}
