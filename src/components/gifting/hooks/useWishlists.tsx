import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Wishlist, WishlistItem } from "@/types/profile";
import { toast } from "sonner";

interface UseWishlistsResult {
  wishlists: Wishlist[];
  isLoading: boolean;
  error: Error | null;
  fetchWishlists: () => Promise<void>;
  createWishlist: (title: string, description?: string, category?: string, tags?: string[], priority?: "low" | "medium" | "high") => Promise<Wishlist | null>;
  deleteWishlist: (wishlistId: string) => Promise<void>;
  addToWishlist: (wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">) => Promise<boolean>;
  removeFromWishlist: (wishlistId: string, itemId: string) => Promise<boolean>;
}

export function useWishlists(): UseWishlistsResult {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch wishlists with items for the signed-in user
  const fetchWishlists = useCallback(async () => {
    if (!user) {
      setWishlists([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { data: wishlistsData, error: wishlistsError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // More detailed error logging
      if (wishlistsError) {
        console.error("[useWishlists] Supabase fetchWishlists error:", wishlistsError);
        if (wishlistsError.code) {
          console.error(`[useWishlists] Error code: ${wishlistsError.code}`);
        }
        if (wishlistsError.details) {
          console.error(`[useWishlists] Error details: ${wishlistsError.details}`);
        }
        if (wishlistsError.hint) {
          console.error(`[useWishlists] Error hint: ${wishlistsError.hint}`);
        }
        if (wishlistsError.message) {
          console.error(`[useWishlists] Error message: ${wishlistsError.message}`);
        }
        throw wishlistsError;
      }

      if (!wishlistsData || wishlistsData.length === 0) {
        console.info("[useWishlists] No wishlists found for user", user.id);
        setWishlists([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      const wishlistsWithItems: Wishlist[] = [];
      for (const wishlist of wishlistsData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("wishlist_items")
          .select("*")
          .eq("wishlist_id", wishlist.id);

        if (itemsError) {
          console.error(`[useWishlists] Supabase fetch items error for wishlist_id: ${wishlist.id}`, itemsError);
          if (itemsError.code) {
            console.error(`[useWishlists] Items error code: ${itemsError.code}`);
          }
          if (itemsError.details) {
            console.error(`[useWishlists] Items error details: ${itemsError.details}`);
          }
          if (itemsError.hint) {
            console.error(`[useWishlists] Items error hint: ${itemsError.hint}`);
          }
          if (itemsError.message) {
            console.error(`[useWishlists] Items error message: ${itemsError.message}`);
          }
          throw itemsError;
        }

        wishlistsWithItems.push({
          ...wishlist,
          items: itemsData || [],
        });
      }

      setWishlists(wishlistsWithItems);
      console.log("[useWishlists] Loaded wishlists with items for user", user.id, wishlistsWithItems);

    } catch (err: any) {
      setError(err);
      toast.error(
        "Failed to fetch wishlists" +
          (err?.message ? `: ${err.message}` : "")
      );
      setWishlists([]);
      // Extra log for full context:
      console.error("[useWishlists] fetchWishlists failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch wishlists on mount/user change
  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  // Create a new wishlist
  const createWishlist = useCallback(
    async (
      title: string,
      description = "",
      category?: string,
      tags?: string[],
      priority?: "low" | "medium" | "high"
    ) => {
      if (!user) {
        toast.error("You must be logged in to create a wishlist");
        return null;
      }
      try {
        const { data, error } = await supabase
          .from("wishlists")
          .insert([
            {
              user_id: user.id,
              title,
              description,
              category,
              tags,
              priority,
              is_public: false,
            },
          ])
          .select("*")
          .single();

        if (error) throw error;

        const newWishlist: Wishlist = { ...data, items: [] };
        setWishlists((prev) => [newWishlist, ...prev]);
        toast.success("Wishlist created!");
        return newWishlist;
      } catch (err: any) {
        setError(err);
        toast.error("Failed to create wishlist");
        return null;
      }
    },
    [user]
  );

  // Delete wishlist and its items
  const deleteWishlist = useCallback(
    async (wishlistId: string) => {
      try {
        // Delete wishlist items first (for referential integrity)
        await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId);

        // Delete wishlist itself
        const { error } = await supabase.from("wishlists").delete().eq("id", wishlistId);
        if (error) throw error;

        setWishlists((prev) => prev.filter((w) => w.id !== wishlistId));
        toast.success("Wishlist deleted!");
      } catch (err: any) {
        setError(err);
        toast.error("Failed to delete wishlist");
      }
    },
    []
  );

  // Add item to wishlist
  const addToWishlist = useCallback(
    async (wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">) => {
      try {
        const { data, error } = await supabase
          .from("wishlist_items")
          .insert([
            {
              ...item,
              wishlist_id: wishlistId,
              created_at: new Date().toISOString(),
            },
          ])
          .select("*")
          .single();
        if (error) throw error;

        // Optimistically update
        setWishlists((prev) =>
          prev.map((wl) =>
            wl.id === wishlistId ? { ...wl, items: [...(wl.items || []), data] } : wl
          )
        );
        toast.success("Item added to wishlist!");
        return true;
      } catch (err: any) {
        setError(err);
        toast.error("Failed to add item to wishlist");
        return false;
      }
    },
    []
  );

  // Remove item from wishlist
  const removeFromWishlist = useCallback(
    async (wishlistId: string, itemId: string) => {
      try {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("id", itemId);
        if (error) throw error;

        setWishlists((prev) =>
          prev.map((wl) =>
            wl.id === wishlistId
              ? { ...wl, items: (wl.items || []).filter((item) => item.id !== itemId) }
              : wl
          )
        );
        toast.success("Item removed from wishlist");
        return true;
      } catch (err: any) {
        setError(err);
        toast.error("Failed to remove item from wishlist");
        return false;
      }
    },
    []
  );

  return {
    wishlists,
    isLoading,
    error,
    fetchWishlists,
    createWishlist,
    deleteWishlist,
    addToWishlist,
    removeFromWishlist,
  };
}
