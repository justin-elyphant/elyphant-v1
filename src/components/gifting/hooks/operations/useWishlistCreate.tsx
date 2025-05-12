
import { useState } from "react";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";

export function useWishlistCreate(
  setWishlists: (wishlists: Wishlist[]) => void,
  syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<void>
) {
  const [isCreating, setIsCreating] = useState(false);

  const createWishlist = async (
    title: string, 
    description?: string, 
    category?: string, 
    tags?: string[],
    priority?: "low" | "medium" | "high"
  ): Promise<Wishlist | null> => {
    try {
      setIsCreating(true);
      
      // Create new wishlist object
      const newWishlist: Wishlist = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description?.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: [],
        category,
        tags,
        priority
      };
      
      // Update local state
      setWishlists((prevWishlists) => [...prevWishlists, newWishlist]);
      
      // Sync with profile
      await syncWishlistToProfile([...wishlists, newWishlist]);
      
      console.log("Created new wishlist:", newWishlist);
      return newWishlist;
    } catch (err) {
      console.error("Error creating wishlist:", err);
      
      // Show error notification
      toast.error("Failed to create wishlist", {
        description: "An error occurred while creating your wishlist."
      });
      
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createWishlist, isCreating };
}
