
import { useCallback } from "react";
import { toast } from "sonner";
import { WishlistItem, Wishlist } from "@/types/profile";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export function useWishlistModify(
  setWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>, 
  setWishlistedProducts: React.Dispatch<React.SetStateAction<string[]>>, 
  syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<boolean>
) {
  const { user } = useAuth();

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

  return { addToWishlist, removeFromWishlist };
}
