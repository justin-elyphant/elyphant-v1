
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from "@/types/profile";
import { toast } from "sonner";

// Define how we reconstruct our Wishlist and WishlistItem types from the new DB schema
function dbToWishlist(raw: any, items: WishlistItem[]): Wishlist {
  return normalizeWishlist({
    ...raw,
    id: raw.id,
    user_id: raw.user_id,
    title: raw.title,
    description: raw.description || "",
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    is_public: raw.is_public,
    category: raw.category,
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : raw.tags
      ? Array.isArray(raw.tags)
        ? raw.tags
        : typeof raw.tags === "string"
        ? raw.tags.split(",").map((t: string) => t.trim())
        : []
      : [],
    priority: raw.priority,
    items: items,
  });
}

function dbToWishlistItem(raw: any): WishlistItem {
  return normalizeWishlistItem({
    ...raw,
    id: raw.id,
    wishlist_id: raw.wishlist_id,
    product_id: raw.product_id,
    name: raw.name,
    title: raw.title,
    image_url: raw.image_url,
    price: raw.price ? Number(raw.price) : undefined,
    brand: raw.brand,
    created_at: raw.created_at,
  });
}

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

  // Helper: Load wishlists and their items for this user
  const fetchWishlists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setWishlists([]);
      setIsLoading(false);
      return;
    }
    try {
      // Fetch wishlists for the user
      const { data: wlData, error: wlError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (wlError) throw wlError;

      // Fetch wishlist items for these wishlists
      const allWishlistIds = wlData ? wlData.map((wl) => wl.id) : [];
      let items: WishlistItem[] = [];
      if (allWishlistIds.length > 0) {
        const { data: itemData, error: itemErr } = await supabase
          .from("wishlist_items")
          .select("*")
          .in("wishlist_id", allWishlistIds);
        if (itemErr) throw itemErr;
        items = (itemData || []).map(dbToWishlistItem);
      }

      // Group items by wishlist
      const wishlistMap: { [id: string]: WishlistItem[] } = {};
      items.forEach((item) => {
        wishlistMap[item.wishlist_id] = wishlistMap[item.wishlist_id] || [];
        wishlistMap[item.wishlist_id].push(item);
      });

      const wishlistsArr = (wlData || []).map((wl) =>
        dbToWishlist(wl, wishlistMap[wl.id] || [])
      );
      setWishlists(wishlistsArr);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error("Unknown error fetching wishlists"));
      setWishlists([]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  // Create new wishlist
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
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("wishlists")
          .insert([
            {
              user_id: user.id,
              title: title.trim(),
              description: description?.trim() || "",
              category,
              tags: tags || [],
              priority,
            },
          ])
          .select("*")
          .single();
        if (error || !data) {
          toast.error("Failed to create wishlist");
          throw error || new Error("Failed to create wishlist");
        }
        const newWishlist = dbToWishlist(data, []);
        setWishlists((prev) => [newWishlist, ...prev]);
        toast.success("Wishlist created!");
        return newWishlist;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error("Unknown error creating wishlist"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Delete wishlist and its items
  const deleteWishlist = useCallback(
    async (wishlistId: string) => {
      if (!user) {
        toast.error("You must be logged in");
        return;
      }
      setIsLoading(true);
      try {
        // Deletion will cascade items as well
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("id", wishlistId);
        if (error) {
          toast.error("Failed to delete wishlist");
          throw error;
        }
        setWishlists((current) => current.filter((w) => w.id !== wishlistId));
        toast.success("Wishlist deleted!");
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error deleting wishlist"));
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Add item to wishlist
  const addToWishlist = useCallback(
    async (wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">) => {
      if (!user) {
        toast.error("You must be logged in to add an item");
        return false;
      }

      // Prevent duplicate: check if item is already present
      const wishlist = wishlists.find((wl) => wl.id === wishlistId);
      if (wishlist && wishlist.items.some((i) => i.product_id === item.product_id)) {
        toast.info("Item already exists in wishlist");
        return false;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("wishlist_items")
          .insert([
            {
              wishlist_id: wishlistId,
              product_id: item.product_id,
              name: item.name,
              title: item.title,
              image_url: item.image_url,
              price: item.price,
              brand: item.brand,
            },
          ])
          .select("*")
          .single();

        if (error || !data) {
          toast.error("Failed to add item to wishlist");
          throw error || new Error("Failed to add item");
        }
        // Refresh wishlists to get updated state
        await fetchWishlists();
        toast.success("Item added to wishlist!");
        return true;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error("Unknown error adding to wishlist"));
        return false;
      } finally {
        setIsLoading(false);
      }
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
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("id", itemId)
          .eq("wishlist_id", wishlistId);
        if (error) {
          toast.error("Failed to remove item from wishlist");
          throw error;
        }
        await fetchWishlists();
        toast.success("Item removed from wishlist");
        return true;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error("Unknown error removing wishlist item"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, fetchWishlists]
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

// The useWishlists.tsx file is now >300 lines and should be split up for maintainability in the next step.
