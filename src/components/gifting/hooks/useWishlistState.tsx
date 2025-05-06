
import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { WishlistItem, Wishlist } from "@/types/profile";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export function useWishlistState() {
  const [wishlistedProducts, setWishlistedProducts] = useLocalStorage<string[]>('wishlistedProducts', []);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const { user } = useAuth();
  
  // Sync with profile on load if user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const syncWishlistWithProfile = async () => {
      try {
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('gift_preferences, wishlists')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile for wishlist sync:", error);
          return;
        }
        
        // Handle legacy format (gift_preferences)
        if (!profile?.wishlists && profile?.gift_preferences) {
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
        } 
        // Handle new format (wishlists array)
        else if (profile?.wishlists && Array.isArray(profile.wishlists)) {
          console.log("Loaded wishlists from profile:", profile.wishlists);
          setWishlists(profile.wishlists);
          
          // Update local storage for backward compatibility
          const allProductIds = profile.wishlists.flatMap(list => 
            list.items.map(item => item.product_id)
          );
          
          if (allProductIds.length > 0) {
            setWishlistedProducts(allProductIds);
          }
        }
      } catch (err) {
        console.error("Error syncing wishlist with profile:", err);
      }
    };
    
    syncWishlistWithProfile();
  }, [user, wishlistedProducts]);

  return {
    wishlistedProducts,
    setWishlistedProducts,
    wishlists, 
    setWishlists
  };
}
