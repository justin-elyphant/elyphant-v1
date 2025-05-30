
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

export function useWishlist() {
  // Simply pass through the unified wishlist interface
  return useUnifiedWishlist();
}
