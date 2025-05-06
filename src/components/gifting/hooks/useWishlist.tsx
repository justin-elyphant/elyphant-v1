
import { useWishlistOperations } from "./useWishlistOperations";

export function useWishlist() {
  const {
    wishlistedProducts,
    wishlists,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist
  } = useWishlistOperations();

  return {
    wishlistedProducts,
    wishlists,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist
  };
}
