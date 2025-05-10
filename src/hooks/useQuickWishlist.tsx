
import { useState } from "react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";

interface ProductInfo {
  id: string;
  name: string;
  image?: string;
  price?: number;
  brand?: string;
}

export const useQuickWishlist = () => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { wishlists, addToWishlist } = useWishlist();
  const navigate = useNavigate();
  
  // Handle adding/removing from wishlist with proper feedback
  const toggleWishlist = (e: React.MouseEvent, product: ProductInfo) => {
    e.stopPropagation();
    
    // If user is not logged in, show sign-up dialog
    if (!userData) {
      setShowSignUpDialog(true);
      return;
    }
    
    // Toggle wishlist state
    const productId = product.id;
    const wasAlreadyFavorited = isFavorited(productId);
    
    handleFavoriteToggle(productId);
    
    // Show appropriate toast based on action
    if (wasAlreadyFavorited) {
      toast.success("Removed from wishlist", {
        description: product.name,
      });
    } else {
      // If there's at least one wishlist, offer to add to a specific wishlist
      if (wishlists && wishlists.length > 0) {
        const defaultWishlist = wishlists[0];
        
        // Try to find a default or "My Wishlist" wishlist
        const targetWishlist = wishlists.find(w => 
          w.title === "My Wishlist" || w.title.toLowerCase().includes("default")
        ) || defaultWishlist;
        
        // Only show this toast if the item wasn't already in any wishlist
        toast.success("Added to wishlist", {
          description: product.name,
          action: {
            label: "View Wishlist",
            onClick: () => navigate("/wishlists")
          },
          // For additional actions, we need to use Sonner's supported format
          // Using a second action button instead of altAction
          ...(wishlists.length > 1 ? {
            action: {
              label: "View Wishlist",
              onClick: () => navigate("/wishlists")
            }
          } : {}),
          onDismiss: wishlists.length > 1 ? () => {
            // This could trigger a popover or modal to select a different wishlist
            document.getElementById(`wishlist-trigger-${productId}`)?.click();
          } : undefined
        });
      } else {
        toast.success("Added to wishlist", {
          description: product.name,
          action: {
            label: "View Wishlist",
            onClick: () => navigate("/wishlists")
          }
        });
      }
    }
  };
  
  return {
    toggleWishlist,
    isFavorited,
    showSignUpDialog,
    setShowSignUpDialog,
    isLoggedIn: !!userData
  };
};
