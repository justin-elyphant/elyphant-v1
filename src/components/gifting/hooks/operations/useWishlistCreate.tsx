
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";

export function useWishlistCreate(
  setWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>,
  syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<boolean>
) {
  const createWishlist = async (
    title: string, 
    description: string = "",
    category?: string,
    tags?: string[],
    priority?: 'low' | 'medium' | 'high'
  ) => {
    try {
      const newWishlist: Wishlist = {
        id: crypto.randomUUID(),
        title,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: [],
        category: category || "other",
        tags: tags || [],
        priority: priority || "medium"
      };
      
      setWishlists(prev => [newWishlist, ...prev]);
      
      await syncWishlistToProfile([newWishlist, ...await getCurrentWishlists(setWishlists)]);
      toast.success("Wishlist created successfully");
      return newWishlist;
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist");
      throw error;
    }
  };

  return { createWishlist };
}

// Helper function to get current wishlists state when syncing
const getCurrentWishlists = async (
  getWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>
): Promise<Wishlist[]> => {
  return new Promise<Wishlist[]>((resolve) => {
    getWishlists((current) => {
      resolve(current);
      return current;
    });
  });
};
