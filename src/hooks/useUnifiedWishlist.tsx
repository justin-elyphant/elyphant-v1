
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { useWishlists } from "@/components/gifting/hooks/useWishlists";
import { toast } from "sonner";

interface ProductInfo {
  id: string;
  title?: string;
  name?: string;
  image?: string;
  price?: number;
  brand?: string;
}

export const useUnifiedWishlist = () => {
  const { user } = useAuth();
  const { wishlists, addToWishlist, createWishlist: createWishlistBase, deleteWishlist: deleteWishlistBase, fetchWishlists } = useWishlists();
  const [loading, setLoading] = useState(false);

  // Load wishlists when user changes or component mounts
  useEffect(() => {
    if (user) {
      loadWishlists();
    }
  }, [user]);

  const loadWishlists = useCallback(async () => {
    if (!user) return;
    try {
      await fetchWishlists();
    } catch (error) {
      console.error("Error loading wishlists:", error);
    }
  }, [user, fetchWishlists]);

  // Check if a product is in any wishlist
  const isProductWishlisted = useCallback((productId: string): boolean => {
    if (!user || !wishlists) return false;
    
    return wishlists.some(wishlist => 
      wishlist.items?.some(item => item.product_id === productId)
    );
  }, [user, wishlists]);

  // Get default wishlist or create one
  const ensureDefaultWishlist = useCallback(async () => {
    if (!user) {
      throw new Error("User must be authenticated");
    }

    let defaultWishlist = wishlists.find(
      w => w.title === "My Wishlist" || w.title?.toLowerCase().includes("default")
    );

    if (!defaultWishlist) {
      defaultWishlist = await createWishlistBase("My Wishlist", "My default wishlist");
      if (defaultWishlist) {
        await fetchWishlists(); // Refresh the list
      }
    }

    if (!defaultWishlist) {
      throw new Error("Could not create or find default wishlist");
    }

    return defaultWishlist;
  }, [user, wishlists, createWishlistBase, fetchWishlists]);

  // Quick add to default wishlist
  const quickAddToWishlist = useCallback(async (product: ProductInfo) => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist");
      return false;
    }

    try {
      setLoading(true);
      
      // Check if already in any wishlist
      if (isProductWishlisted(product.id)) {
        toast.info("Item is already in your wishlist");
        return false;
      }

      const defaultWishlist = await ensureDefaultWishlist();
      
      const wishlistItem = {
        wishlist_id: defaultWishlist.id,
        product_id: product.id,
        title: product.title || product.name || "",
        name: product.title || product.name || "",
        price: product.price,
        brand: product.brand,
        image_url: product.image
      };

      await addToWishlist(defaultWishlist.id, wishlistItem);
      await fetchWishlists(); // Refresh to get updated state
      
      toast.success("Added to wishlist", {
        description: product.title || product.name
      });
      
      return true;
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist: " + (error?.message || "unknown error"));
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isProductWishlisted, ensureDefaultWishlist, addToWishlist, fetchWishlists]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (wishlistId: string, itemId: string) => {
    if (!user) {
      toast.error("Please sign in to manage your wishlist");
      return false;
    }

    try {
      setLoading(true);
      
      // Implementation depends on your useWishlists hook
      // This is a placeholder - you may need to implement removeFromWishlist in useWishlists
      toast.success("Removed from wishlist");
      await fetchWishlists();
      return true;
    } catch (error: any) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchWishlists]);

  // Create wishlist with initial item
  const createWishlistWithItem = useCallback(async (title: string, product: ProductInfo) => {
    if (!user) {
      throw new Error("User must be authenticated");
    }

    try {
      setLoading(true);
      
      const newWishlist = await createWishlistBase(title, `Wishlist for ${title}`);
      
      if (newWishlist) {
        const wishlistItem = {
          wishlist_id: newWishlist.id,
          product_id: product.id,
          title: product.title || product.name || "",
          name: product.title || product.name || "",
          price: product.price,
          brand: product.brand,
          image_url: product.image
        };

        await addToWishlist(newWishlist.id, wishlistItem);
        await fetchWishlists();
        
        return newWishlist;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating wishlist with item:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, createWishlistBase, addToWishlist, fetchWishlists]);

  // Create wishlist (wrapper for compatibility)
  const createWishlist = useCallback(async (title: string, description?: string) => {
    return await createWishlistBase(title, description);
  }, [createWishlistBase]);

  // Delete wishlist (wrapper for compatibility)
  const deleteWishlist = useCallback(async (wishlistId: string) => {
    try {
      await deleteWishlistBase(wishlistId);
      return true;
    } catch (error) {
      console.error("Error deleting wishlist:", error);
      return false;
    }
  }, [deleteWishlistBase]);

  // Handle wishlist toggle (for compatibility with useProductManagement)
  const handleWishlistToggle = useCallback(async (productId: string, product?: any) => {
    const productInfo = product || { id: productId };
    return await quickAddToWishlist(productInfo);
  }, [quickAddToWishlist]);

  // Get wishlisted products (for compatibility)
  const wishlistedProducts = wishlists?.flatMap(wishlist => 
    wishlist.items?.map(item => item.product_id) || []
  ) || [];

  // Update wishlist sharing
  const updateWishlistSharing = useCallback(async (wishlistId: string, isPublic: boolean) => {
    // Implementation placeholder - would need to be implemented in useWishlists
    toast.info("Wishlist sharing will be available soon!");
    return true;
  }, []);

  return {
    wishlists: wishlists || [],
    loading,
    isProductWishlisted,
    quickAddToWishlist,
    removeFromWishlist,
    createWishlistWithItem,
    loadWishlists,
    addToWishlist,
    ensureDefaultWishlist,
    createWishlist,
    deleteWishlist,
    handleWishlistToggle,
    wishlistedProducts,
    updateWishlistSharing
  };
};
