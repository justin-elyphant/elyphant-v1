
import { useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";

export function useWishlistSync() {
  const { user } = useAuth();
  
  // Sync changes to profile
  const syncWishlistToProfile = useCallback(async (wishlists: Wishlist[]) => {
    if (!user) return false;
    
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
        return false;
      }
      
      console.log("Wishlist sync completed successfully");
      return true;
    } catch (err) {
      console.error("Error syncing wishlist to profile:", err);
      toast.error("Failed to update your wishlists");
      return false;
    }
  }, [user]);
  
  return { syncWishlistToProfile };
}
