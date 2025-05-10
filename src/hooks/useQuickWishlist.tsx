
import { useState } from "react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProductInfo {
  id: string;
  name: string;
  image?: string;
  price?: number;
}

export const useQuickWishlist = () => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
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
      toast.success("Added to wishlist", {
        description: product.name,
        action: {
          label: "View Wishlist",
          onClick: () => navigate("/wishlists")
        }
      });
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
