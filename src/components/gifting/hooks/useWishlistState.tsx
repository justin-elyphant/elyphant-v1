
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
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  // Sync with profile on load if user is authenticated with improved error handling
  useEffect(() => {
    let isMounted = true;
    
    if (!user) {
      // If no user, we're still initialized but with empty data
      if (isMounted) {
        setIsInitialized(true);
        setIsLoading(false);
      }
      return;
    }
    
    const syncWishlistWithProfile = async () => {
      try {
        setIsLoading(true);
        setInitError(null);
        console.log("Fetching wishlist data from profile for user:", user.id);
        
        // Fetch user profile with retries
        let profile = null;
        let error = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!profile && attempts < maxAttempts) {
          attempts++;
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('gift_preferences, wishlists')
            .eq('id', user.id)
            .single();
            
          if (fetchError) {
            console.error(`Error fetching profile for wishlist sync (attempt ${attempts}):`, fetchError);
            error = fetchError;
            if (attempts < maxAttempts) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else {
            profile = data;
            break;
          }
        }
        
        if (!profile) {
          console.error("Failed to fetch profile after multiple attempts:", error);
          if (isMounted) {
            setInitError(new Error("Failed to load wishlists from your profile"));
            setIsLoading(false);
          }
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
            if (isMounted) {
              setWishlists(validWishlists);
              
              // Update local storage for backward compatibility
              const allProductIds = validWishlists.flatMap(list => 
                list.items.map(item => item.product_id)
              );
              
              if (allProductIds.length > 0) {
                console.log("Updating local wishlistedProducts with", allProductIds.length, "items");
                setWishlistedProducts(allProductIds);
              }
            }
          } else if (profile.wishlists.length > 0) {
            console.warn("Found wishlists array but items were invalid:", profile.wishlists);
            // Create a default wishlist if we have corrupt data
            createDefaultWishlist();
          } else {
            // Create a default wishlist if we have an empty array
            console.log("Empty wishlist array found, creating default");
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
        
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error syncing wishlist with profile:", err);
        if (isMounted) {
          setInitError(err instanceof Error ? err : new Error("Unknown error loading wishlists"));
          setIsLoading(false);
          setIsInitialized(true); // Mark as initialized so the app can proceed
        }
      }
    };
    
    const handleLegacyPreferences = (preferences: any[]) => {
      if (!Array.isArray(preferences)) {
        createDefaultWishlist();
        return;
      }
      
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
              name: `Item ${productId}`,
              added_at: new Date().toISOString()
            }))
          };
          
          setWishlists([defaultWishlist]);
          syncWishlist([defaultWishlist]);
        }
      } else {
        createDefaultWishlist();
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
    
    return () => {
      isMounted = false;
    };
  }, [user, wishlistedProducts]);

  const reloadWishlists = async () => {
    setIsLoading(true);
    setInitError(null);
    
    try {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error reloading wishlists:", error);
        setInitError(new Error("Failed to reload wishlists"));
        return;
      }
      
      if (profile?.wishlists && Array.isArray(profile.wishlists)) {
        const validWishlists = profile.wishlists.filter(list => 
          list && typeof list === 'object' && list.id && Array.isArray(list.items)
        );
        
        setWishlists(validWishlists);
        
        // Update local storage for backward compatibility
        const allProductIds = validWishlists.flatMap(list => 
          list.items.map(item => item.product_id)
        );
        
        if (allProductIds.length > 0) {
          setWishlistedProducts(allProductIds);
        }
      }
    } catch (err) {
      console.error("Error in reloadWishlists:", err);
      setInitError(err instanceof Error ? err : new Error("Failed to reload wishlists"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wishlistedProducts,
    setWishlistedProducts,
    wishlists, 
    setWishlists,
    isInitialized,
    isLoading,
    initError,
    reloadWishlists
  };
}
