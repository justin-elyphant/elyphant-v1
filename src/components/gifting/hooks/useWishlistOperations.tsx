
import { useCallback } from "react";
import { toast } from "sonner";
import { WishlistItem, Wishlist } from "@/types/profile";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { useWishlistState } from "./useWishlistState";
import { useWishlistSync } from "./useWishlistSync";

export function useWishlistOperations() {
  const { user } = useAuth();
  const { 
    wishlistedProducts, 
    setWishlistedProducts,
    wishlists, 
    setWishlists,
    isInitialized
  } = useWishlistState();
  
  const { syncWishlistToProfile } = useWishlistSync();

  const handleWishlistToggle = useCallback((productId: string) => {
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
  }, [setWishlistedProducts]);

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
      
      // Update profile using our new sync function
      await syncWishlistToProfile(updatedWishlists);
      
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
  }, [user, setWishlists, setWishlistedProducts, syncWishlistToProfile]);
  
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
      
      // Update profile using our new sync function
      await syncWishlistToProfile(updatedWishlists);
      
      // Update local state
      setWishlists(updatedWishlists);
      
      // Check if product exists in any other wishlist
      const productId = itemToRemove.product_id;
      const productInOtherWishlist = updatedWishlists.some(
        list => list.items.some(item => item.product_id === productId)
      );
      
      if (!productInOtherWishlist) {
        setWishlistedProducts(prev => prev.filter(id => id !== productId));
      }
      
      toast.success("Item removed from wishlist");
      return true;
    } catch (err) {
      console.error("Error removing item from wishlist:", err);
      toast.error("Failed to remove item from wishlist");
      return false;
    }
  }, [user, setWishlists, setWishlistedProducts, syncWishlistToProfile]);
  
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
      
      // Get product IDs from this wishlist to update local storage
      const productsToCheckForRemoval = existingWishlists[wishlistIndex].items.map(item => item.product_id);
      
      // Update wishlists array
      const updatedWishlists = [
        ...existingWishlists.slice(0, wishlistIndex),
        ...existingWishlists.slice(wishlistIndex + 1)
      ];
      
      // Update profile using our new sync function
      await syncWishlistToProfile(updatedWishlists);
      
      // Update local state
      setWishlists(updatedWishlists);
      
      // Update local storage - remove products that don't exist in any other wishlist
      for (const productId of productsToCheckForRemoval) {
        const productInOtherWishlist = updatedWishlists.some(
          list => list.items.some(item => item.product_id === productId)
        );
        
        if (!productInOtherWishlist) {
          setWishlistedProducts(prev => prev.filter(id => id !== productId));
        }
      }
      
      toast.success("Wishlist deleted");
      return true;
    } catch (err) {
      console.error("Error deleting wishlist:", err);
      toast.error("Failed to delete wishlist");
      return false;
    }
  }, [user, setWishlists, setWishlistedProducts, syncWishlistToProfile]);

  return {
    wishlistedProducts,
    wishlists,
    isInitialized,
    handleWishlistToggle,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist
  };
}
