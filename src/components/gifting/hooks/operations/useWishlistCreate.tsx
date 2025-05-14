
import { useState } from "react";
import { Wishlist, normalizeWishlist } from "@/types/profile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

export function useWishlistCreate(
  setWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>,
  syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<boolean>
) {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const createWishlist = async (
    title: string, 
    description?: string, 
    category?: string, 
    tags?: string[],
    priority?: "low" | "medium" | "high"
  ): Promise<Wishlist | null> => {
    try {
      if (!user) {
        toast.error("You must be logged in to create a wishlist");
        return null;
      }
      
      setIsCreating(true);
      
      // Create new wishlist object
      const newWishlist: Wishlist = normalizeWishlist({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: [],
        category,
        tags,
        priority
      });
      
      // Update local state
      let updatedWishlists: Wishlist[] = [];
      setWishlists((prevWishlists) => {
        updatedWishlists = [...prevWishlists, newWishlist];
        return updatedWishlists;
      });
      
      // Sync with profile
      await syncWishlistToProfile(updatedWishlists);
      
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
