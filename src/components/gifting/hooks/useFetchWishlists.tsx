
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist, WishlistItem } from "@/types/profile";
import { toast } from "sonner";

/**
 * Fetches all wishlists (with their items) for the provided user ID.
 */
export function useFetchWishlists() {
  const fetchWishlists = useCallback(async (userId: string): Promise<{ wishlists: Wishlist[]; error: Error | null }> => {
    if (!userId) return { wishlists: [], error: null };
    try {
      const { data: wishlistsData, error: wishlistsError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (wishlistsError) {
        console.error("[useFetchWishlists] Supabase error:", wishlistsError);
        toast.error(`Fetch wishlists: ${wishlistsError.message}`);
        return { wishlists: [], error: wishlistsError as Error };
      }

      if (!wishlistsData || wishlistsData.length === 0) {
        return { wishlists: [], error: null };
      }

      const wishlistsWithItems: Wishlist[] = [];
      for (const wishlist of wishlistsData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("wishlist_items")
          .select("*")
          .eq("wishlist_id", wishlist.id);

        if (itemsError) {
          console.error(`[useFetchWishlists] Items error for wishlist_id ${wishlist.id}:`, itemsError);
          toast.error(`Fetch wishlist items: ${itemsError.message}`);
          return { wishlists: [], error: itemsError as Error };
        }

        wishlistsWithItems.push({
          ...wishlist,
          items: itemsData || [],
        });
      }
      return { wishlists: wishlistsWithItems, error: null };
    } catch (err: any) {
      console.error("[useFetchWishlists] Unexpected error:", err);
      toast.error("Unexpected error fetching wishlists");
      return { wishlists: [], error: err instanceof Error ? err : new Error("Unknown error") };
    }
  }, []);
  return { fetchWishlists };
}
