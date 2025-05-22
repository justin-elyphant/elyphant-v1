import { useState } from "react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
// No longer need localStorage!
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useAuth } from "@/contexts/auth"; // Use Supabase auth context!

interface ProductInfo {
  id: string;
  name: string;
  image?: string;
  price?: number;
  brand?: string;
}

export const useQuickWishlist = () => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  // ---- UPDATE: Use Supabase user from AuthContext ----
  const { user } = useAuth();
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { wishlists, addToWishlist } = useWishlist();
  const navigate = useNavigate();
  
  // Toggle wishlist and show proper feedback
  const toggleWishlist = (e: React.MouseEvent, product: ProductInfo) => {
    e.stopPropagation();

    // ---- Use Supabase user check! ----
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }

    const productId = product.id;
    const wasAlreadyFavorited = isFavorited(productId);

    handleFavoriteToggle(productId);

    // Toasts remain the same
    if (wasAlreadyFavorited) {
      toast.success("Removed from wishlist", {
        description: product.name,
      });
    } else {
      if (wishlists && wishlists.length > 0) {
        const defaultWishlist = wishlists[0];
        const targetWishlist = wishlists.find(w => 
          w.title === "My Wishlist" || w.title.toLowerCase().includes("default")
        ) || defaultWishlist;
        
        toast.success("Added to wishlist", {
          description: product.name,
          action: {
            label: "View Wishlist",
            onClick: () => navigate("/wishlists")
          },
          ...(wishlists.length > 1 ? {
            action: {
              label: "View Wishlist",
              onClick: () => navigate("/wishlists")
            }
          } : {}),
          onDismiss: wishlists.length > 1 ? () => {
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
    // ---- Expose this for possible conditional UI ----
    isLoggedIn: !!user
  };
};
