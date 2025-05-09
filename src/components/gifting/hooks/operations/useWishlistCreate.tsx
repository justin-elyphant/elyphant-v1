
import { useCallback } from "react";
import { toast } from "sonner";
import { Wishlist } from "@/types/profile";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export function useWishlistCreate(setWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>, syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<boolean>) {
  const { user } = useAuth();

  // Create a new wishlist
  const createWishlist = useCallback(async (title: string, description: string = "") => {
    if (!user) {
      toast.error("You must be logged in to create a wishlist");
      return null;
    }
    
    try {
      // Create new wishlist object
      const newWishlist: Wishlist = {
        id: crypto.randomUUID(),
        title,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: []
      };
      
      // Get existing wishlists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        console.error("Error fetching wishlists:", fetchError);
        throw fetchError;
      }
      
      // Update wishlists array
      const existingWishlists = profile?.wishlists || [];
      const updatedWishlists = [...existingWishlists, newWishlist];
      
      // Update profile using our new sync function
      await syncWishlistToProfile(updatedWishlists);
      
      // Update local state
      setWishlists(updatedWishlists);
      
      toast.success(`Wishlist "${title}" created`);
      return newWishlist;
    } catch (err) {
      console.error("Error creating wishlist:", err);
      toast.error("Failed to create wishlist");
      return null;
    }
  }, [user, setWishlists, syncWishlistToProfile]);

  return { createWishlist };
}
