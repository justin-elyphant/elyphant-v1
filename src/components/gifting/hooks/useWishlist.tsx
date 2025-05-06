
import { toast } from "sonner";
import { useLocalStorage } from "./useLocalStorage";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const useWishlist = () => {
  const [wishlistedProducts, setWishlistedProducts] = useLocalStorage<string[]>('wishlistedProducts', []);
  const { user } = useAuth();
  
  // Sync with profile on load if user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const syncWishlistWithProfile = async () => {
      try {
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('gift_preferences')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile for wishlist sync:", error);
          return;
        }
        
        if (!profile?.gift_preferences) return;
        
        // Extract product IDs from gift preferences
        const profileWishlistedProducts = profile.gift_preferences
          .filter(pref => pref.importance === "high")
          .map(pref => pref.category);
        
        console.log("Loaded wishlisted products from profile:", profileWishlistedProducts);
        
        // Merge with local wishlist
        const combinedWishlist = Array.from(new Set([
          ...wishlistedProducts,
          ...profileWishlistedProducts
        ]));
        
        if (combinedWishlist.length !== wishlistedProducts.length) {
          console.log("Updating local wishlist with profile data:", combinedWishlist);
          setWishlistedProducts(combinedWishlist);
        }
      } catch (err) {
        console.error("Error syncing wishlist with profile:", err);
      }
    };
    
    syncWishlistWithProfile();
  }, [user]);
  
  // Sync changes to profile when wishlist changes
  useEffect(() => {
    if (!user || wishlistedProducts.length === 0) return;
    
    const updateProfileWithWishlist = async () => {
      try {
        // First get existing profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('gift_preferences')
          .eq('id', user.id)
          .single();
          
        if (fetchError) {
          console.error("Error fetching profile for wishlist update:", fetchError);
          return;
        }
        
        // Get existing preferences that are not high importance (not wishlist items)
        const existingPreferences = profile?.gift_preferences || [];
        const nonWishlistPreferences = existingPreferences.filter(pref => 
          pref.importance !== "high" || !wishlistedProducts.includes(pref.category)
        );
        
        // Format wishlist items as gift preferences
        const wishlistPreferences = wishlistedProducts.map(productId => ({
          category: productId,
          importance: "high" as const
        }));
        
        // Combine preferences
        const updatedPreferences = [
          ...nonWishlistPreferences,
          ...wishlistPreferences
        ];
        
        // Update profile with new preferences
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            gift_preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error("Error updating profile with wishlist:", updateError);
        } else {
          console.log("Successfully updated profile with wishlist");
        }
      } catch (err) {
        console.error("Error updating profile with wishlist:", err);
      }
    };
    
    // Use a debounce to avoid too many updates
    const timeoutId = setTimeout(() => {
      updateProfileWithWishlist();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [wishlistedProducts, user]);

  const handleWishlistToggle = (productId: string) => {
    setWishlistedProducts(prev => {
      const newWishlisted = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      if (newWishlisted.includes(productId)) {
        toast.success("Added to wishlist");
      } else {
        toast.info("Removed from wishlist");
      }
      
      return newWishlisted;
    });
  };

  return {
    wishlistedProducts,
    handleWishlistToggle
  };
};
