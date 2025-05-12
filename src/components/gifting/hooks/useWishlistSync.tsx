
import { useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";

export function useWishlistSync() {
  const { user } = useAuth();
  
  // Sync changes to profile
  const syncWishlistToProfile = useCallback(async (wishlists: Wishlist[]): Promise<void> => {
    if (!user) return;
    
    try {
      console.log("Syncing wishlists to profile:", wishlists.length, "wishlists");
      
      // Update profile with new wishlists
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wishlists: wishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating profile with wishlist:", updateError);
        toast.error("Failed to save wishlist changes");
      }
      
      console.log("Wishlist sync completed successfully");
    } catch (err) {
      console.error("Error syncing wishlist to profile:", err);
      toast.error("Failed to update your wishlists");
    }
  }, [user]);

  // Update wishlist sharing settings
  const updateWishlistSharingSettings = useCallback(async (wishlistId: string, isPublic: boolean): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Get existing wishlists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        console.error("Error fetching wishlists:", fetchError);
        return false;
      }
      
      const existingWishlists = profile?.wishlists || [];
      
      // Find the wishlist to update
      const wishlistIndex = existingWishlists.findIndex(list => list.id === wishlistId);
      
      if (wishlistIndex === -1) {
        toast.error("Wishlist not found");
        return false;
      }
      
      // Update the wishlist
      const updatedWishlist = {
        ...existingWishlists[wishlistIndex],
        is_public: isPublic,
        updated_at: new Date().toISOString()
      };
      
      // Update wishlists array
      const updatedWishlists = [
        ...existingWishlists.slice(0, wishlistIndex),
        updatedWishlist,
        ...existingWishlists.slice(wishlistIndex + 1)
      ];
      
      // Update profile
      await syncWishlistToProfile(updatedWishlists);
      return true;
    } catch (err) {
      console.error("Error updating wishlist sharing settings:", err);
      toast.error("Failed to update wishlist sharing settings");
      return false;
    }
  }, [user, syncWishlistToProfile]);
  
  return { 
    syncWishlistToProfile,
    updateWishlistSharingSettings 
  };
}
