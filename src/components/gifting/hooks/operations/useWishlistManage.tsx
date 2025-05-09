
import { useCallback } from "react";
import { toast } from "sonner";
import { Wishlist } from "@/types/profile";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export function useWishlistManage(
  setWishlists: React.Dispatch<React.SetStateAction<Wishlist[]>>, 
  setWishlistedProducts: React.Dispatch<React.SetStateAction<string[]>>, 
  syncWishlistToProfile: (wishlists: Wishlist[]) => Promise<boolean>,
  updateWishlistSharingSettings: (wishlistId: string, isPublic: boolean) => Promise<boolean>
) {
  const { user } = useAuth();
  
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

  // Update wishlist sharing settings
  const updateWishlistSharing = useCallback(async (wishlistId: string, isPublic: boolean) => {
    if (!user) {
      toast.error("You must be logged in to update wishlist sharing settings");
      return false;
    }
    
    try {
      // Update wishlist sharing settings
      const success = await updateWishlistSharingSettings(wishlistId, isPublic);
      
      if (success) {
        // Update local state
        setWishlists(prev => prev.map(wishlist => 
          wishlist.id === wishlistId ? { ...wishlist, is_public: isPublic } : wishlist
        ));
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error updating wishlist sharing settings:", err);
      toast.error("Failed to update wishlist sharing settings");
      return false;
    }
  }, [user, updateWishlistSharingSettings, setWishlists]);

  // Toggle wishlist items
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

  return { deleteWishlist, updateWishlistSharing, handleWishlistToggle };
}
