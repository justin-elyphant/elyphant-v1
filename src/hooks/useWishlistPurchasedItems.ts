import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch purchased item IDs for a wishlist
 * Used to display "Purchased" badges on wishlist items
 */
export function useWishlistPurchasedItems(wishlistId: string | undefined) {
  const [purchasedItemIds, setPurchasedItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedItems = async () => {
      if (!wishlistId) {
        setPurchasedItemIds(new Set());
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("wishlist_item_purchases")
          .select("item_id")
          .eq("wishlist_id", wishlistId);

        if (error) {
          console.error("Error fetching purchased items:", error);
          setPurchasedItemIds(new Set());
        } else {
          setPurchasedItemIds(new Set(data?.map((row) => row.item_id) || []));
        }
      } catch (err) {
        console.error("Error fetching purchased items:", err);
        setPurchasedItemIds(new Set());
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedItems();
  }, [wishlistId]);

  return { purchasedItemIds, loading };
}
