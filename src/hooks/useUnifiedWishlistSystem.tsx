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
      
      // Fetch wishlists from the wishlists table
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (wishlistError) {
        console.error("Error fetching wishlists:", wishlistError);
        throw wishlistError;
      }

      if (!wishlistData || !Array.isArray(wishlistData)) {
        return [];
      }

      // Fetch items for each wishlist
      const wishlistsWithItems = await Promise.all(
        wishlistData.map(async (wishlist) => {
          const { data: items, error: itemsError } = await supabase
            .from('wishlist_items')
            .select('*')
            .eq('wishlist_id', wishlist.id)
            .order('created_at', { ascending: false });

          if (itemsError) {
            console.error(`Error fetching items for wishlist ${wishlist.id}:`, itemsError);
          }

          return normalizeWishlist({
            ...wishlist,
            items: items || []
          });
        })
      );

      return wishlistsWithItems;
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
          event: '*',
          schema: 'public',
          table: 'wishlists',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wishlist real-time update:', payload);
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.wishlists(user.id)
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist_items',
        },
        (payload) => {
          console.log('Wishlist item real-time update:', payload);
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

  // Create or update wishlist in the wishlists table
  const saveWishlistToDatabase = useCallback(async (wishlist: Wishlist, isUpdate = false) => {
    if (!user) throw new Error("User must be authenticated");

    if (isUpdate) {
      const { error } = await supabase
        .from('wishlists')
        .update({
          title: wishlist.title,
          description: wishlist.description,
          is_public: wishlist.is_public,
          category: wishlist.category ?? null,
          tags: Array.isArray(wishlist.tags) ? wishlist.tags : null,
          priority: wishlist.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', wishlist.id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error updating wishlist:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          id: wishlist.id,
          user_id: wishlist.user_id,
          title: wishlist.title,
          description: wishlist.description,
          is_public: wishlist.is_public || false,
          category: wishlist.category ?? null,
          tags: Array.isArray(wishlist.tags) ? wishlist.tags : null,
          priority: wishlist.priority || "medium",
          created_at: wishlist.created_at,
          updated_at: wishlist.updated_at
        } as any);

      if (error) {
        console.error("Error creating wishlist:", error);
        throw error;
      }
    }

    return wishlist;
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

      await saveWishlistToDatabase(newWishlist, false);
      
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

      // Delete all items first
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlistId);

      // Delete the wishlist
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting wishlist:", error);
        throw error;
      }
      
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

      // Check if wishlist exists and belongs to user
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('id', wishlistId)
        .eq('user_id', user.id)
        .single();

      if (!wishlist) throw new Error("Wishlist not found");
      
      // Check if item already exists
      const { data: existingItems } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', wishlistId)
        .eq('product_id', item.product_id);

      if (existingItems && existingItems.length > 0) {
        throw new Error("Item already exists in this wishlist");
      }

      const newItem: WishlistItem = normalizeWishlistItem({
        id: crypto.randomUUID(),
        wishlist_id: wishlistId,
        created_at: new Date().toISOString(),
        ...item
      });

      // Insert the item into the database
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          id: newItem.id,
          wishlist_id: newItem.wishlist_id,
          product_id: newItem.product_id,
          title: newItem.title,
          name: newItem.name,
          price: newItem.price,
          brand: newItem.brand,
          image_url: newItem.image_url,
          created_at: newItem.created_at
        });

      if (error) {
        console.error("Error adding item to wishlist:", error);
        throw error;
      }

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

      // Get the item details before deletion for the toast
      const { data: itemToRemove } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('id', itemId)
        .eq('wishlist_id', wishlistId)
        .single();
      
      if (!itemToRemove) throw new Error("Item not found in wishlist");

      // Delete the item from the database
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('wishlist_id', wishlistId);

      if (error) {
        console.error("Error removing item from wishlist:", error);
        throw error;
      }

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

  // Update wishlist details mutation
  const updateWishlistMutation = useMutation({
    mutationFn: async ({
      wishlistId,
      data,
    }: {
      wishlistId: string;
      data: {
        title?: string;
        description?: string;
        category?: string | null;
        tags?: string[] | null;
        priority?: 'low' | 'medium' | 'high';
      };
    }) => {
      if (!user) throw new Error("User must be authenticated");

      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (typeof data.title === 'string') payload.title = data.title.trim();
      if (typeof data.description === 'string') payload.description = data.description.trim();

      if (data.category === null) payload.category = null;
      else if (typeof data.category === 'string') {
        const cleaned = data.category.trim();
        payload.category = cleaned.length ? cleaned : null;
      }

      if (data.tags === null) payload.tags = null;
      else if (Array.isArray(data.tags)) payload.tags = data.tags;

      if (data.priority) payload.priority = data.priority;

      const { error } = await supabase
        .from('wishlists')
        .update(payload)
        .eq('id', wishlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error updating wishlist:", error);
        throw error;
      }

      return { wishlistId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.wishlists(user?.id || ''),
      });
      toast.success("Wishlist updated");
    },
    onError: (error: any) => {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
    },
  });

  // Update wishlist sharing mutation
  const updateWishlistSharingMutation = useMutation({
    mutationFn: async ({ wishlistId, isPublic }: { wishlistId: string; isPublic: boolean }) => {
      if (!user) throw new Error("User must be authenticated");

      const { error } = await supabase
        .from('wishlists')
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', wishlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error updating wishlist sharing:", error);
        throw error;
      }

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
    updateWishlist: updateWishlistMutation.mutateAsync,
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
    isUpdating: updateWishlistMutation.isPending,
    isUpdatingSharing: updateWishlistSharingMutation.isPending,

    // Manual refresh
    loadWishlists: refetchWishlists,

    // Legacy compatibility
    handleWishlistToggle,
    ensureDefaultWishlist: getDefaultWishlist,
  };
};