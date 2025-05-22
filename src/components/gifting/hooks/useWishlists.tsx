import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Wishlist, WishlistItem } from "@/types/profile";
import { toast } from "sonner";
import { useFetchWishlists } from "./useFetchWishlists";
import * as wishlistCRUD from "./wishlistCRUD";

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
  const { fetchWishlists } = useFetchWishlists();

  // Fetch wishlists with items for the signed-in user
  const fetchWishlistsWrapped = useCallback(async () => {
    if (!user) {
      setWishlists([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);

    const { wishlists: fetchedLists, error: fetchErr } = await fetchWishlists(user.id);
    if (fetchErr) {
      setError(fetchErr);
      setWishlists([]);
    } else {
      setWishlists(fetchedLists);
      setError(null);
    }
    setIsLoading(false);
  }, [user, fetchWishlists]);

  useEffect(() => {
    fetchWishlistsWrapped();
  }, [fetchWishlistsWrapped]);

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
      const newWishlist = await wishlistCRUD.createWishlist(user.id, title, description, category, tags, priority);
      if (newWishlist) setWishlists((prev) => [newWishlist, ...prev]);
      return newWishlist;
    },
    [user]
  );

  // Delete wishlist and its items
  const deleteWishlist = useCallback(
    async (wishlistId: string) => {
      const success = await wishlistCRUD.deleteWishlist(wishlistId);
      if (success) setWishlists((prev) => prev.filter((w) => w.id !== wishlistId));
    },
    []
  );

  // Add item to wishlist
  const addToWishlist = useCallback(
    async (wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">) => {
      const data = await wishlistCRUD.addToWishlist(wishlistId, item);
      if (data) {
        setWishlists((prev) =>
          prev.map((wl) =>
            wl.id === wishlistId ? { ...wl, items: [...(wl.items || []), data] } : wl
          )
        );
        return true;
      }
      return false;
    },
    []
  );

  // Remove item from wishlist
  const removeFromWishlist = useCallback(
    async (wishlistId: string, itemId: string) => {
      const success = await wishlistCRUD.removeFromWishlist(wishlistId, itemId);
      if (success) {
        setWishlists((prev) =>
          prev.map((wl) =>
            wl.id === wishlistId
              ? { ...wl, items: (wl.items || []).filter((item) => item.id !== itemId) }
              : wl
          )
        );
      }
      return success;
    },
    []
  );

  return {
    wishlists,
    isLoading,
    error,
    fetchWishlists: fetchWishlistsWrapped,
    createWishlist,
    deleteWishlist,
    addToWishlist,
    removeFromWishlist,
  };
}
