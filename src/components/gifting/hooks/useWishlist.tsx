
import { toast } from "sonner";
import { useLocalStorage } from "./useLocalStorage";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { WishlistItem, Wishlist, giftPreferencesToWishlistItems, wishlistItemsToGiftPreferences } from "@/types/profile";

export const useWishlist = () => {
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
        
        // First, handle legacy format (gift_preferences)
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
          
          // Create a default wishlist from gift preferences
          if (profileWishlistedProducts.length > 0) {
            const defaultWishlist: Wishlist = {
              id: "default",
              title: "My Wishlist",
              description: "Items I'd like to receive",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_public: true,
              items: giftPreferencesToWishlistItems(profile.gift_preferences)
            };
            
            setWishlists([defaultWishlist]);
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
  }, [user]);
  
  // Sync changes to profile when wishlist changes
  useEffect(() => {
    if (!user || wishlistedProducts.length === 0) return;
    
    const updateProfileWithWishlist = async () => {
      try {
        // First get existing profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('gift_preferences, wishlists')
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
        
        // Handle wishlists array (new format)
        let updatedWishlists = profile?.wishlists || [];
        
        // If no wishlists exist yet, create a default one
        if (updatedWishlists.length === 0 && wishlistedProducts.length > 0) {
          updatedWishlists = [{
            id: crypto.randomUUID(),
            title: "My Wishlist",
            description: "Items I'd like to receive",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_public: true,
            items: wishlistedProducts.map(productId => ({
              id: crypto.randomUUID(),
              name: productId,
              product_id: productId,
              added_at: new Date().toISOString()
            }))
          }];
        }
        
        // Update profile with new preferences and wishlists
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            gift_preferences: updatedPreferences,
            wishlists: updatedWishlists,
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
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error creating wishlist:", updateError);
        throw updateError;
      }
      
      // Update local state
      setWishlists(updatedWishlists);
      
      toast.success(`Wishlist "${title}" created`);
      return newWishlist;
    } catch (err) {
      console.error("Error creating wishlist:", err);
      toast.error("Failed to create wishlist");
      return null;
    }
  }, [user]);
  
  // Add item to wishlist
  const addToWishlist = useCallback(async (wishlistId: string, item: Omit<WishlistItem, 'id' | 'added_at'>) => {
    if (!user) {
      toast.error("You must be logged in to update wishlists");
      return false;
    }
    
    try {
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
      
      const existingWishlists = profile?.wishlists || [];
      
      // Find the wishlist to update
      const wishlistIndex = existingWishlists.findIndex(list => list.id === wishlistId);
      
      if (wishlistIndex === -1) {
        toast.error("Wishlist not found");
        return false;
      }
      
      // Check if item already exists
      const existingItem = existingWishlists[wishlistIndex].items.find(
        i => i.product_id === item.product_id
      );
      
      if (existingItem) {
        toast.info("Item already exists in this wishlist");
        return false;
      }
      
      // Create full item
      const newItem: WishlistItem = {
        id: crypto.randomUUID(),
        added_at: new Date().toISOString(),
        ...item
      };
      
      // Update wishlist
      const updatedWishlist = {
        ...existingWishlists[wishlistIndex],
        items: [...existingWishlists[wishlistIndex].items, newItem],
        updated_at: new Date().toISOString()
      };
      
      // Update wishlists array
      const updatedWishlists = [
        ...existingWishlists.slice(0, wishlistIndex),
        updatedWishlist,
        ...existingWishlists.slice(wishlistIndex + 1)
      ];
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error adding item to wishlist:", updateError);
        throw updateError;
      }
      
      // Also update legacy gift_preferences for backward compatibility
      const { data: prefProfile, error: prefError } = await supabase
        .from('profiles')
        .select('gift_preferences')
        .eq('id', user.id)
        .single();
        
      if (!prefError) {
        const existingPrefs = prefProfile?.gift_preferences || [];
        
        // Add this item as high importance preference if not already there
        if (!existingPrefs.some(pref => pref.category === item.product_id)) {
          const updatedPrefs = [
            ...existingPrefs,
            { category: item.product_id, importance: 'high' as const }
          ];
          
          await supabase
            .from('profiles')
            .update({ 
              gift_preferences: updatedPrefs,
            })
            .eq('id', user.id);
        }
      }
      
      // Update local state
      setWishlists(updatedWishlists);
      setWishlistedProducts(prev => {
        if (prev.includes(item.product_id)) return prev;
        return [...prev, item.product_id];
      });
      
      toast.success("Item added to wishlist");
      return true;
    } catch (err) {
      console.error("Error adding item to wishlist:", err);
      toast.error("Failed to add item to wishlist");
      return false;
    }
  }, [user]);
  
  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (wishlistId: string, itemId: string) => {
    if (!user) {
      toast.error("You must be logged in to update wishlists");
      return false;
    }
    
    try {
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
      
      const existingWishlists = profile?.wishlists || [];
      
      // Find the wishlist to update
      const wishlistIndex = existingWishlists.findIndex(list => list.id === wishlistId);
      
      if (wishlistIndex === -1) {
        toast.error("Wishlist not found");
        return false;
      }
      
      // Find the item to remove
      const itemToRemove = existingWishlists[wishlistIndex].items.find(item => item.id === itemId);
      
      if (!itemToRemove) {
        toast.error("Item not found in wishlist");
        return false;
      }
      
      // Remove the item
      const updatedItems = existingWishlists[wishlistIndex].items.filter(item => item.id !== itemId);
      
      // Update the wishlist
      const updatedWishlist = {
        ...existingWishlists[wishlistIndex],
        items: updatedItems,
        updated_at: new Date().toISOString()
      };
      
      // Update wishlists array
      const updatedWishlists = [
        ...existingWishlists.slice(0, wishlistIndex),
        updatedWishlist,
        ...existingWishlists.slice(wishlistIndex + 1)
      ];
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error removing item from wishlist:", updateError);
        throw updateError;
      }
      
      // Also update legacy gift_preferences for backward compatibility
      // Only if this product is not in any other wishlist
      const productId = itemToRemove.product_id;
      const productInOtherWishlist = updatedWishlists.some(
        list => list.items.some(item => item.product_id === productId)
      );
      
      if (!productInOtherWishlist) {
        const { data: prefProfile, error: prefError } = await supabase
          .from('profiles')
          .select('gift_preferences')
          .eq('id', user.id)
          .single();
          
        if (!prefError) {
          const existingPrefs = prefProfile?.gift_preferences || [];
          
          // Remove high importance preferences for this product
          const updatedPrefs = existingPrefs.filter(
            pref => !(pref.category === productId && pref.importance === 'high')
          );
          
          await supabase
            .from('profiles')
            .update({ 
              gift_preferences: updatedPrefs,
            })
            .eq('id', user.id);
            
          // Update local storage
          setWishlistedProducts(prev => prev.filter(id => id !== productId));
        }
      }
      
      // Update local state
      setWishlists(updatedWishlists);
      
      toast.success("Item removed from wishlist");
      return true;
    } catch (err) {
      console.error("Error removing item from wishlist:", err);
      toast.error("Failed to remove item from wishlist");
      return false;
    }
  }, [user]);
  
  // Delete wishlist
  const deleteWishlist = useCallback(async (wishlistId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a wishlist");
      return false;
    }
    
    try {
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
      
      const existingWishlists = profile?.wishlists || [];
      
      // Find the wishlist to delete
      const wishlistIndex = existingWishlists.findIndex(list => list.id === wishlistId);
      
      if (wishlistIndex === -1) {
        toast.error("Wishlist not found");
        return false;
      }
      
      // Get product IDs from this wishlist to remove from legacy storage
      const productsToRemove = existingWishlists[wishlistIndex].items.map(item => item.product_id);
      
      // Update wishlists array
      const updatedWishlists = [
        ...existingWishlists.slice(0, wishlistIndex),
        ...existingWishlists.slice(wishlistIndex + 1)
      ];
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error deleting wishlist:", updateError);
        throw updateError;
      }
      
      // Also update legacy gift_preferences for backward compatibility
      // For each product, check if it exists in any other wishlist
      for (const productId of productsToRemove) {
        const productInOtherWishlist = updatedWishlists.some(
          list => list.items.some(item => item.product_id === productId)
        );
        
        if (!productInOtherWishlist) {
          const { data: prefProfile, error: prefError } = await supabase
            .from('profiles')
            .select('gift_preferences')
            .eq('id', user.id)
            .single();
            
          if (!prefError) {
            const existingPrefs = prefProfile?.gift_preferences || [];
            
            // Remove high importance preferences for this product
            const updatedPrefs = existingPrefs.filter(
              pref => !(pref.category === productId && pref.importance === 'high')
            );
            
            await supabase
              .from('profiles')
              .update({ 
                gift_preferences: updatedPrefs,
              })
              .eq('id', user.id);
              
            // Update local storage
            setWishlistedProducts(prev => prev.filter(id => id !== productId));
          }
        }
      }
      
      // Update local state
      setWishlists(updatedWishlists);
      
      toast.success("Wishlist deleted");
      return true;
    } catch (err) {
      console.error("Error deleting wishlist:", err);
      toast.error("Failed to delete wishlist");
      return false;
    }
  }, [user]);

  return {
    wishlistedProducts,
    handleWishlistToggle,
    wishlists,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist
  };
};
