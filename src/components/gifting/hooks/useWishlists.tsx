
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from "@/types/profile";
import { toast } from "sonner";

interface UseWishlistsResult {
  wishlists: Wishlist[];
  isLoading: boolean;
  error: Error | null;
  fetchWishlists: () => Promise<void>;
  createWishlist: (
    title: string,
    description?: string,
    category?: string,
    tags?: string[],
    priority?: "low" | "medium" | "high"
  ) => Promise<Wishlist | null>;
  deleteWishlist: (wishlistId: string) => Promise<void>;
  addToWishlist: (wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">) => Promise<boolean>;
  removeFromWishlist: (wishlistId: string, itemId: string) => Promise<boolean>;
}

export function useWishlists(): UseWishlistsResult {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch wishlists from profile
  const fetchWishlists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setWishlists([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("wishlists")
        .eq("id", user.id)
        .single();

      if (fetchErr) {
        setError(fetchErr);
        setWishlists([]);
      } else {
        const rawWishlists = profile?.wishlists ?? [];
        setWishlists(Array.isArray(rawWishlists) ? rawWishlists.map(normalizeWishlist) : []);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setWishlists([]);
    }
    setIsLoading(false);
  }, [user]);

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
      const newWishlist: Wishlist = normalizeWishlist({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: [],
        category,
        tags,
        priority,
      });
      let updatedWishlists: Wishlist[] = [];
      setWishlists((prev) => {
        updatedWishlists = [newWishlist, ...prev];
        return updatedWishlists;
      });

      // Write to profile
      const { error } = await supabase
        .from("profiles")
        .update({
          wishlists: [newWishlist, ...(wishlists || [])],
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to create wishlist");
        setWishlists((prev) => prev.filter((w) => w.id !== newWishlist.id));
        return null;
      } else {
        toast.success("Wishlist created!");
      }
      return newWishlist;
    },
    [user, wishlists]
  );

  // Delete wishlist
  const deleteWishlist = useCallback(
    async (wishlistId: string) => {
      const updated = wishlists.filter((w) => w.id !== wishlistId);
      setWishlists(updated);

      if (!user) {
        toast.error("You must be logged in");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          wishlists: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to delete wishlist");
        // roll back if failed
        fetchWishlists();
        return;
      }
      toast.success("Wishlist deleted!");
    },
    [user, wishlists, fetchWishlists]
  );

  // Add item to wishlist
  const addToWishlist = useCallback(
    async (wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">) => {
      if (!user) {
        toast.error("You must be logged in to add an item");
        return false;
      }

      let added = false;
      setWishlists((prev) => {
        let found = false;
        const result = prev.map((wl) => {
          if (wl.id === wishlistId) {
            if (wl.items.find((i) => i.product_id === item.product_id)) {
              toast.info("Item already exists in wishlist");
              found = true;
              return wl;
            }
            found = true;
            added = true;
            return {
              ...wl,
              items: [
                ...wl.items,
                normalizeWishlistItem({
                  ...item,
                  id: crypto.randomUUID(),
                  wishlist_id: wishlistId,
                  created_at: new Date().toISOString(),
                }),
              ],
              updated_at: new Date().toISOString(),
            };
          }
          return wl;
        });
        return result;
      });

      const curr = wishlists.map((wl) =>
        wl.id === wishlistId
          ? {
              ...wl,
              items: [
                ...wl.items,
                normalizeWishlistItem({
                  ...item,
                  id: crypto.randomUUID(),
                  wishlist_id: wishlistId,
                  created_at: new Date().toISOString(),
                }),
              ],
              updated_at: new Date().toISOString(),
            }
          : wl
      );
      // Save to profile
      const { error } = await supabase
        .from("profiles")
        .update({
          wishlists: curr,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to add item to wishlist");
        fetchWishlists();
        return false;
      }
      if (added) {
        toast.success("Item added to wishlist!");
      }
      return true;
    },
    [user, wishlists, fetchWishlists]
  );

  // Remove item from wishlist
  const removeFromWishlist = useCallback(
    async (wishlistId: string, itemId: string) => {
      if (!user) {
        toast.error("You must be logged in to remove items");
        return false;
      }

      let removed = false;
      setWishlists((prev) => {
        const updated = prev.map((wl) =>
          wl.id === wishlistId
            ? {
                ...wl,
                items: wl.items.filter((item) => {
                  if (item.id === itemId) removed = true;
                  return item.id !== itemId;
                }),
                updated_at: new Date().toISOString(),
              }
            : wl
        );
        return updated;
      });

      const curr = wishlists.map((wl) =>
        wl.id === wishlistId
          ? {
              ...wl,
              items: wl.items.filter((item) => item.id !== itemId),
              updated_at: new Date().toISOString(),
            }
          : wl
      );

      const { error } = await supabase
        .from("profiles")
        .update({
          wishlists: curr,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to remove item from wishlist");
        fetchWishlists();
        return false;
      }
      if (removed) {
        toast.success("Item removed from wishlist");
      }
      return removed;
    },
    [user, wishlists, fetchWishlists]
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
