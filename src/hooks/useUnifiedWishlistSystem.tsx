import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from "@/types/profile";

interface ProductInfo {
  id: string;
  title?: string;
  name?: string;
  image?: string;
  price?: number;
  brand?: string;
}

interface WishlistItemInput {
  product_id: string;
  title: string;
  name?: string;
  price?: number;
  brand?: string;
  image_url?: string;
}

// Query keys for React Query
const QUERY_KEYS = {
  wishlists: (userId: string) => ['wishlists', userId],
  wishlistItems: (wishlistId: string) => ['wishlist-items', wishlistId],
} as const;

export const useUnifiedWishlistSystem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Fetch wishlists with React Query
  const {
    data: wishlists = [],
    isLoading,
    error,
    refetch: refetchWishlists
  } = useQuery({
    queryKey: QUERY_KEYS.wishlists(user?.id || ''),
    queryFn: async () => {
      if (!user) return [];
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching wishlists:", error);
        throw error;
      }

      if (!profile?.wishlists || !Array.isArray(profile.wishlists)) {
        return [];
      }

      return profile.wishlists
        .filter(list => list && typeof list === 'object' && list.id)
        .map(list => normalizeWishlist({ ...list, user_id: user.id }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Real-time subscription setup
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wishlists_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wishlist real-time update:', payload);
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.wishlists(user.id)
          });
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setRealtimeChannel(null);
    };
  }, [user, queryClient]);

  // Utility function to sync wishlists to profile
  const syncWishlistsToProfile = useCallback(async (updatedWishlists: Wishlist[]) => {
    if (!user) throw new Error("User must be authenticated");

    const { error } = await supabase
      .from('profiles')
      .update({
        wishlists: updatedWishlists,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error("Error syncing wishlists to profile:", error);
      throw error;
    }

    return updatedWishlists;
  }, [user]);

  // Create wishlist mutation
  const createWishlistMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      if (!user) throw new Error("User must be authenticated");

      const newWishlist: Wishlist = normalizeWishlist({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: [],
      });

      const updatedWishlists = [...wishlists, newWishlist];
      await syncWishlistsToProfile(updatedWishlists);
      
      return newWishlist;
    },
    onSuccess: (newWishlist) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.wishlists(user?.id || '')
      });
      toast.success("Wishlist created successfully");
    },
    onError: (error: any) => {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist");
    }
  });

  // Delete wishlist mutation
  const deleteWishlistMutation = useMutation({
    mutationFn: async (wishlistId: string) => {
      if (!user) throw new Error("User must be authenticated");

      const updatedWishlists = wishlists.filter(w => w.id !== wishlistId);
      await syncWishlistsToProfile(updatedWishlists);
      
      return wishlistId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.wishlists(user?.id || '')
      });
      toast.success("Wishlist deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting wishlist:", error);
      toast.error("Failed to delete wishlist");
    }
  });

  // Add item to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async ({ wishlistId, item }: { wishlistId: string; item: WishlistItemInput }) => {
      if (!user) throw new Error("User must be authenticated");

      const wishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
      if (wishlistIndex === -1) throw new Error("Wishlist not found");

      const targetWishlist = wishlists[wishlistIndex];
      
      // Check if item already exists
      const existingItem = targetWishlist.items.find(i => i.product_id === item.product_id);
      if (existingItem) {
        throw new Error("Item already exists in this wishlist");
      }

      const newItem: WishlistItem = normalizeWishlistItem({
        id: crypto.randomUUID(),
        wishlist_id: wishlistId,
        added_at: new Date().toISOString(),
        ...item
      });

      const updatedWishlist = {
        ...targetWishlist,
        items: [...targetWishlist.items, newItem],
        updated_at: new Date().toISOString()
      };

      const updatedWishlists = [
        ...wishlists.slice(0, wishlistIndex),
        updatedWishlist,
        ...wishlists.slice(wishlistIndex + 1)
      ];

      await syncWishlistsToProfile(updatedWishlists);
      return { wishlistId, item: newItem };
    },
    onSuccess: ({ item }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.wishlists(user?.id || '')
      });
      toast.success("Added to wishlist", {
        description: item.title || item.name
      });
    },
    onError: (error: any) => {
      console.error("Error adding to wishlist:", error);
      if (error.message === "Item already exists in this wishlist") {
        toast.info("Item is already in this wishlist");
      } else {
        toast.error("Failed to add to wishlist");
      }
    }
  });

  // Remove item from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async ({ wishlistId, itemId }: { wishlistId: string; itemId: string }) => {
      if (!user) throw new Error("User must be authenticated");

      const wishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
      if (wishlistIndex === -1) throw new Error("Wishlist not found");

      const targetWishlist = wishlists[wishlistIndex];
      const itemToRemove = targetWishlist.items.find(item => item.id === itemId);
      
      if (!itemToRemove) throw new Error("Item not found in wishlist");

      const updatedItems = targetWishlist.items.filter(item => item.id !== itemId);
      const updatedWishlist = {
        ...targetWishlist,
        items: updatedItems,
        updated_at: new Date().toISOString()
      };

      const updatedWishlists = [
        ...wishlists.slice(0, wishlistIndex),
        updatedWishlist,
        ...wishlists.slice(wishlistIndex + 1)
      ];

      await syncWishlistsToProfile(updatedWishlists);
      return { wishlistId, itemId, removedItem: itemToRemove };
    },
    onSuccess: ({ removedItem }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.wishlists(user?.id || '')
      });
      toast.success("Removed from wishlist", {
        description: removedItem.title || removedItem.name
      });
    },
    onError: (error: any) => {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  });

  // Update wishlist sharing mutation
  const updateWishlistSharingMutation = useMutation({
    mutationFn: async ({ wishlistId, isPublic }: { wishlistId: string; isPublic: boolean }) => {
      if (!user) throw new Error("User must be authenticated");

      const wishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
      if (wishlistIndex === -1) throw new Error("Wishlist not found");

      const updatedWishlist = {
        ...wishlists[wishlistIndex],
        is_public: isPublic,
        updated_at: new Date().toISOString()
      };

      const updatedWishlists = [
        ...wishlists.slice(0, wishlistIndex),
        updatedWishlist,
        ...wishlists.slice(wishlistIndex + 1)
      ];

      await syncWishlistsToProfile(updatedWishlists);
      return { wishlistId, isPublic };
    },
    onSuccess: ({ isPublic }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.wishlists(user?.id || '')
      });
      toast.success(`Wishlist is now ${isPublic ? 'public' : 'private'}`);
    },
    onError: (error: any) => {
      console.error("Error updating wishlist sharing:", error);
      toast.error("Failed to update wishlist sharing");
    }
  });

  // Helper functions
  const isProductWishlisted = useCallback((productId: string): boolean => {
    if (!user || !wishlists) return false;
    return wishlists.some(wishlist => 
      wishlist.items?.some(item => item.product_id === productId)
    );
  }, [user, wishlists]);

  const getDefaultWishlist = useCallback(async () => {
    let defaultWishlist = wishlists.find(
      w => w.title === "My Wishlist" || w.title?.toLowerCase().includes("default")
    );

    if (!defaultWishlist) {
      const result = await createWishlistMutation.mutateAsync({
        title: "My Wishlist",
        description: "My default wishlist"
      });
      defaultWishlist = result;
    }

    return defaultWishlist;
  }, [wishlists, createWishlistMutation]);

  const quickAddToWishlist = useCallback(async (product: ProductInfo) => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist");
      return false;
    }

    try {
      // Check if already in any wishlist
      if (isProductWishlisted(product.id)) {
        toast.info("Item is already in your wishlist");
        return false;
      }

      const defaultWishlist = await getDefaultWishlist();
      
      await addToWishlistMutation.mutateAsync({
        wishlistId: defaultWishlist.id,
        item: {
          product_id: product.id,
          title: product.title || product.name || "",
          name: product.title || product.name || "",
          price: product.price,
          brand: product.brand,
          image_url: product.image
        }
      });

      return true;
    } catch (error: any) {
      console.error("Error in quickAddToWishlist:", error);
      return false;
    }
  }, [user, isProductWishlisted, getDefaultWishlist, addToWishlistMutation]);

  const createWishlistWithItem = useCallback(async (title: string, product: ProductInfo) => {
    if (!user) throw new Error("User must be authenticated");

    try {
      const newWishlist = await createWishlistMutation.mutateAsync({
        title,
        description: `Wishlist for ${title}`
      });

      await addToWishlistMutation.mutateAsync({
        wishlistId: newWishlist.id,
        item: {
          product_id: product.id,
          title: product.title || product.name || "",
          name: product.title || product.name || "",
          price: product.price,
          brand: product.brand,
          image_url: product.image
        }
      });

      return newWishlist;
    } catch (error) {
      console.error("Error creating wishlist with item:", error);
      throw error;
    }
  }, [user, createWishlistMutation, addToWishlistMutation]);

  // Legacy compatibility functions
  const handleWishlistToggle = useCallback(async (productId: string, product?: any) => {
    const productInfo = product || { id: productId };
    return await quickAddToWishlist(productInfo);
  }, [quickAddToWishlist]);

  const wishlistedProducts = wishlists?.flatMap(wishlist => 
    wishlist.items?.map(item => item.product_id) || []
  ) || [];

  return {
    // Data
    wishlists,
    wishlistedProducts,
    loading: isLoading,
    error,

    // State checks
    isProductWishlisted,

    // Core operations
    createWishlist: createWishlistMutation.mutateAsync,
    deleteWishlist: deleteWishlistMutation.mutateAsync,
    addToWishlist: addToWishlistMutation.mutateAsync,
    removeFromWishlist: removeFromWishlistMutation.mutateAsync,
    updateWishlistSharing: updateWishlistSharingMutation.mutateAsync,

    // Convenience operations
    quickAddToWishlist,
    createWishlistWithItem,
    getDefaultWishlist,

    // Loading states
    isCreating: createWishlistMutation.isPending,
    isDeleting: deleteWishlistMutation.isPending,
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
    isUpdatingSharing: updateWishlistSharingMutation.isPending,

    // Manual refresh
    loadWishlists: refetchWishlists,

    // Legacy compatibility
    handleWishlistToggle,
    ensureDefaultWishlist: getDefaultWishlist,
  };
};