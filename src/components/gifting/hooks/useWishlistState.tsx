
import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { WishlistItem, Wishlist } from "@/types/profile";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useWishlistState() {
  const [wishlistedProducts, setWishlistedProducts] = useLocalStorage<string[]>('wishlistedProducts', []);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  
  // Sync with profile on load if user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const syncWishlistWithProfile = async () => {
      try {
        console.log("Fetching wishlist data from profile for user:", user.id);
        
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
        
        // Handle new format (wishlists array)
        if (profile?.wishlists && Array.isArray(profile.wishlists)) {
          console.log("Loaded wishlists from profile:", profile.wishlists.length);
          
          // Ensure we have valid wishlist objects
          const validWishlists = profile.wishlists.filter(list => 
            list && typeof list === 'object' && list.id && Array.isArray(list.items)
          );
          
          if (validWishlists.length > 0) {
            setWishlists(validWishlists);
            
            // Update local storage for backward compatibility
            const allProductIds = validWishlists.flatMap(list => 
              list.items.map(item => item.product_id)
            );
            
            if (allProductIds.length > 0) {
              console.log("Updating local wishlistedProducts with", allProductIds.length, "items");
              setWishlistedProducts(allProductIds);
            }
          } else if (profile.wishlists.length > 0) {
            console.warn("Found wishlists array but items were invalid:", profile.wishlists);
            // Create a default wishlist if we have corrupt data
            createDefaultWishlist();
          }
        } 
        // Handle legacy format (gift_preferences)
        else if (profile?.gift_preferences) {
          handleLegacyPreferences(profile.gift_preferences);
        }
        // No data found, create default wishlist
        else {
          console.log("No wishlists found in profile, creating default");
          createDefaultWishlist();
        }
      } catch (err) {
        console.error("Error syncing wishlist with profile:", err);
      } finally {
        setIsInitialized(true);
      }
    };
    
    const handleLegacyPreferences = (preferences: any[]) => {
      if (!Array.isArray(preferences)) return;
      
      // Extract product IDs from gift preferences
      const profileWishlistedProducts = preferences
        .filter(pref => {
          if (typeof pref === 'object' && pref.importance === "high") return true;
          return false;
        })
        .map(pref => typeof pref === 'object' ? pref.category : pref);
      
      console.log("Loaded wishlisted products from legacy preferences:", profileWishlistedProducts);
      
      // Merge with local wishlist
      if (profileWishlistedProducts.length > 0) {
        const combinedWishlist = Array.from(new Set([
          ...wishlistedProducts,
          ...profileWishlistedProducts
        ]));
        
        setWishlistedProducts(combinedWishlist);
        
        // Create a default wishlist from these products
        if (wishlists.length === 0) {
          const defaultWishlist: Wishlist = {
            id: crypto.randomUUID(),
            title: "My Wishlist",
            description: "Items I've saved",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_public: false,
            items: profileWishlistedProducts.map(productId => ({
              id: crypto.randomUUID(),
              product_id: productId,
              added_at: new Date().toISOString()
            }))
          };
          
          setWishlists([defaultWishlist]);
          syncWishlist([defaultWishlist]);
        }
      }
    };
    
    const createDefaultWishlist = () => {
      const defaultWishlist: Wishlist = {
        id: crypto.randomUUID(),
        title: "My Wishlist",
        description: "Items I've saved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: []
      };
      
      setWishlists([defaultWishlist]);
      syncWishlist([defaultWishlist]);
    };
    
    const syncWishlist = async (wishlistsToSync: Wishlist[]) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            wishlists: wishlistsToSync,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) {
          console.error("Error syncing default wishlist to profile:", error);
        }
      } catch (err) {
        console.error("Error in default wishlist creation:", err);
      }
    };
    
    syncWishlistWithProfile();
  }, [user, wishlistedProducts]);

  return {
    wishlistedProducts,
    setWishlistedProducts,
    wishlists, 
    setWishlists,
    isInitialized
  };
}
