
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
      
      // Also update legacy gift_preferences for backward compatibility
      const allProductIds = wishlists.flatMap(list => 
        list.items.map(item => item.product_id)
      );
      
      const { data: prefProfile, error: prefError } = await supabase
        .from('profiles')
        .select('gift_preferences')
        .eq('id', user.id)
        .single();
        
      if (!prefError) {
        const existingPrefs = prefProfile?.gift_preferences || [];
        
        // Get existing preferences that are not high importance (not wishlist items)
        const nonWishlistPreferences = Array.isArray(existingPrefs) 
          ? existingPrefs.filter(pref => {
              if (typeof pref === 'string') return !allProductIds.includes(pref);
              return pref.importance !== "high" || !allProductIds.includes(pref.category);
            })
          : [];
        
        // Format wishlist items as gift preferences
        const wishlistPreferences = allProductIds.map(productId => ({
          category: productId,
          importance: "high" as const
        }));
        
        // Combine preferences
        const updatedPreferences = [
          ...nonWishlistPreferences,
          ...wishlistPreferences
        ];
        
        await supabase
          .from('profiles')
          .update({ 
            gift_preferences: updatedPreferences,
          })
          .eq('id', user.id);
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
