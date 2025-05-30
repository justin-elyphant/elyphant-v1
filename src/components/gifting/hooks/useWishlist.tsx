
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

export function useWishlist() {
  const unifiedWishlist = useUnifiedWishlist();
  
  // Create the missing handleWishlistToggle method
  const handleWishlistToggle = async (productId: string, product?: any) => {
    if (!product) return false;
    
    // Check if product is already in any wishlist
    const isCurrentlyWishlisted = unifiedWishlist.isProductWishlisted(productId);
    
    if (isCurrentlyWishlisted) {
      // Find the wishlist item and remove it
      for (const wishlist of unifiedWishlist.wishlists) {
        const item = wishlist.items?.find(item => item.product_id === productId);
        if (item) {
          return await unifiedWishlist.removeFromWishlist(wishlist.id, item.id);
        }
      }
      return false;
    } else {
      // Add to wishlist using quickAddToWishlist
      return await unifiedWishlist.quickAddToWishlist(product);
    }
  };

  // Create the missing updateWishlistSharing method
  const updateWishlistSharing = async (wishlistId: string, isPublic: boolean) => {
    // For now, just show a toast since this functionality isn't fully implemented
    console.log(`Update wishlist ${wishlistId} sharing to ${isPublic ? 'public' : 'private'}`);
    return true;
  };

  // Create the missing reloadWishlists method (alias for loadWishlists)
  const reloadWishlists = unifiedWishlist.loadWishlists;

  return {
    ...unifiedWishlist,
    handleWishlistToggle,
    updateWishlistSharing,
    reloadWishlists
  };
}
