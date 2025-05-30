
import { useWishlistState } from "./useWishlistState";
import { useWishlistSync } from "./useWishlistSync";
import { useWishlistCreate } from "./operations/useWishlistCreate";
import { useWishlistModify } from "./operations/useWishlistModify";
import { useWishlistManage } from "./operations/useWishlistManage";

export function useWishlistOperations() {
  const { 
    wishlistedProducts, 
    setWishlistedProducts,
    wishlists, 
    setWishlists,
    isInitialized,
    isLoading,
    initError,
    reloadWishlists
  } = useWishlistState();
  
  const { syncWishlistToProfile, updateWishlistSharingSettings } = useWishlistSync();

  const { createWishlist } = useWishlistCreate(setWishlists, syncWishlistToProfile);
  
  const { addToWishlist, removeFromWishlist } = useWishlistModify(
    setWishlists, 
    setWishlistedProducts, 
    syncWishlistToProfile
  );

  const { deleteWishlist, updateWishlistSharing, handleWishlistToggle, updateWishlistDetails } = useWishlistManage(
    setWishlists,
    setWishlistedProducts,
    syncWishlistToProfile,
    updateWishlistSharingSettings
  );

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
    updateWishlistDetails,
    reloadWishlists
  };
}
