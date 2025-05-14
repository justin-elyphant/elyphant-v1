import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/components/gifting/hooks/useLocalStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Wishlist, WishlistItem } from '@/types/profile';
import { toast } from 'sonner';

interface UseWishlistManagementProps {
  initialWishlists?: Wishlist[];
}

export const useWishlistManagement = (props: UseWishlistManagementProps = {}) => {
  const { initialWishlists = [] } = props;
  const [wishlists, setWishlists] = useState<Wishlist[]>(initialWishlists);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userData] = useLocalStorage("userData", null);
  const { user } = useAuth();

  // Load wishlists on mount
  useEffect(() => {
    if (user) {
      fetchWishlists();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch wishlists from Supabase
  const fetchWishlists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setWishlists(data || []);
    } catch (error: any) {
      setError(error);
      toast.error(`Failed to fetch wishlists: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a new wishlist
  const createWishlist = async (title: string, description?: string, is_public: boolean = false) => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert([{ user_id: user?.id, title, description, is_public }])
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      setWishlists(prevWishlists => [data, ...prevWishlists]);
      toast.success(`Wishlist "${title}" created successfully`);
      return data;
    } catch (error: any) {
      setError(error);
      toast.error(`Failed to create wishlist: ${error.message}`);
      return null;
    }
  };

  // Update an existing wishlist
  const updateWishlist = async (wishlistId: string, updates: Partial<Wishlist>) => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .update(updates)
        .eq('id', wishlistId)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      setWishlists(prevWishlists =>
        prevWishlists.map(wishlist => (wishlist.id === wishlistId ? { ...wishlist, ...data } : wishlist))
      );
      toast.success(`Wishlist "${data.title}" updated successfully`);
      return true;
    } catch (error: any) {
      setError(error);
      toast.error(`Failed to update wishlist: ${error.message}`);
      return false;
    }
  };

  // Delete a wishlist
  const deleteWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) {
        throw error;
      }

      setWishlists(prevWishlists => prevWishlists.filter(wishlist => wishlist.id !== wishlistId));
      toast.success("Wishlist deleted successfully");
    } catch (error: any) {
      setError(error);
      toast.error(`Failed to delete wishlist: ${error.message}`);
    }
  };

  // Add a product to a wishlist
  const addProductToWishlist = async (wishlistId: string, product: any) => {
  try {
    // Create a properly formatted wishlist item
    const wishlistItem: Omit<WishlistItem, "id" | "added_at"> = {
      wishlist_id: wishlistId,
      product_id: product.product_id || product.id || "",
      title: product.name || product.title || "",
      created_at: new Date().toISOString(),
      // Include these optional fields
      price: product.price,
      image_url: product.image_url || product.image,
      brand: product.brand,
      name: product.name || product.title || ""
    };

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([wishlistItem])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    setWishlists(prevWishlists =>
      prevWishlists.map(wishlist =>
        wishlist.id === wishlistId
          ? { ...wishlist, items: [...(wishlist.items || []), data] }
          : wishlist
      )
    );
    toast.success(`Product added to wishlist`);
  } catch (error: any) {
    setError(error);
    toast.error(`Failed to add product to wishlist: ${error.message}`);
  }
};

  // Remove a product from a wishlist
  const removeProductFromWishlist = async (wishlistItemId: string, wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', wishlistItemId);

      if (error) {
        throw error;
      }

      setWishlists(prevWishlists =>
        prevWishlists.map(wishlist => ({
          ...wishlist,
          items: wishlist.items?.filter(item => item.id !== wishlistItemId) || []
        }))
      );
      toast.success("Product removed from wishlist");
    } catch (error: any) {
      setError(error);
      toast.error(`Failed to remove product from wishlist: ${error.message}`);
    }
  };

  // Toggle product in favorites (local storage)
  const handleFavoriteToggle = useCallback((productId: string) => {
    if (!userData) {
      return false;
    }

    const existingFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const isAlreadyFavorite = existingFavorites.includes(productId);

    let updatedFavorites;
    if (isAlreadyFavorite) {
      updatedFavorites = existingFavorites.filter((id: string) => id !== productId);
    } else {
      updatedFavorites = [...existingFavorites, productId];
    }

    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    return true;
  }, [userData]);

  // Check if a product is favorited
  const isFavorited = useCallback((productId: string) => {
    if (!userData) {
      return false;
    }

    const existingFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    return existingFavorites.includes(productId);
  }, [userData]);

  return {
    wishlists,
    loading,
    error,
    fetchWishlists,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    addProductToWishlist,
    removeProductFromWishlist,
    handleFavoriteToggle,
    isFavorited
  };
};
