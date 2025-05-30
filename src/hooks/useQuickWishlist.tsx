
import { useState } from "react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useWishlists } from "@/components/gifting/hooks/useWishlists";
import { useAuth } from "@/contexts/auth";

interface ProductInfo {
  id: string;
  name: string;
  image?: string;
  price?: number;
  brand?: string;
}

export const useQuickWishlist = () => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const { user } = useAuth();
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { wishlists, addToWishlist, fetchWishlists, createWishlist } = useWishlists();
  const navigate = useNavigate();
  
  // Ensures wishlist exists (creates "My Wishlist" if missing), returns id
  const ensureWishlist = async () => {
    let wishlist = wishlists && wishlists.find(
      w => w.title === "My Wishlist" || w.title?.toLowerCase().includes("default")
    );
    if (!wishlist) {
      wishlist = await createWishlist("My Wishlist", "Default wishlist");
      if (wishlist) {
        // refetch wishlists so the item can be added to the new one
        await fetchWishlists();
      }
    }
    return wishlist;
  };
  
  // Toggle wishlist and show proper feedback
  const toggleWishlist = async (e: React.MouseEvent, product: ProductInfo) => {
    e.stopPropagation();

    // Show sign-up dialog for unauthenticated users
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }

    const productId = product.id;
    const wasAlreadyFavorited = isFavorited(productId);

    handleFavoriteToggle(productId);

    // Handle wishlist operations for authenticated users
    if (wasAlreadyFavorited) {
      toast.success("Removed from wishlist", {
        description: product.name,
      });
    } else {
      // Store in global wishlist and DB
      let wishlist;
      try {
        wishlist = await ensureWishlist();
        if (!wishlist) {
          toast.error("Could not create a wishlist for this action");
          return;
        }
        // Check if item already exists in wishlist
        const found = wishlist.items?.find(it => it.product_id === productId);
        if (!found) {
          await addToWishlist(wishlist.id, {
            wishlist_id: wishlist.id,
            product_id: productId,
            title: product.name,
            name: product.name,
            price: product.price,
            brand: product.brand,
            image_url: product.image
          });
          await fetchWishlists();
        }
        toast.success("Added to wishlist", {
          description: product.name,
          action: {
            label: "View Wishlist",
            onClick: () => navigate("/wishlists")
          }
        });
      } catch (error: any) {
        toast.error("Could not add to wishlist: " + (error?.message || "unknown error"));
        console.error("Wishlist add error:", error);
      }
    }
  };
  
  return {
    toggleWishlist,
    isFavorited,
    showSignUpDialog,
    setShowSignUpDialog,
    isLoggedIn: !!user
  };
};
