import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseStats {
  totalItems: number;
  purchasedItems: number;
  percentage: number;
}

/**
 * Hook to fetch purchase statistics for a wishlist
 * Returns the total items, purchased items, and completion percentage
 */
export function useWishlistPurchaseStats(wishlistId: string | undefined) {
  const [stats, setStats] = useState<PurchaseStats>({
    totalItems: 0,
    purchasedItems: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!wishlistId) {
        setStats({ totalItems: 0, purchasedItems: 0, percentage: 0 });
        setLoading(false);
        return;
      }

      try {
        // Fetch total items in the wishlist
        const { count: totalItems, error: itemsError } = await supabase
          .from("wishlist_items")
          .select("*", { count: "exact", head: true })
          .eq("wishlist_id", wishlistId);

        if (itemsError) {
          console.error("Error fetching wishlist items count:", itemsError);
          setLoading(false);
          return;
        }

        // Fetch purchased items count
        const { count: purchasedItems, error: purchasedError } = await supabase
          .from("wishlist_item_purchases")
          .select("*", { count: "exact", head: true })
          .eq("wishlist_id", wishlistId);

        if (purchasedError) {
          console.error("Error fetching purchased items count:", purchasedError);
          setLoading(false);
          return;
        }

        const total = totalItems || 0;
        const purchased = purchasedItems || 0;
        const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0;

        setStats({
          totalItems: total,
          purchasedItems: purchased,
          percentage
        });
      } catch (err) {
        console.error("Error fetching purchase stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [wishlistId]);

  return { stats, loading };
}

/**
 * Hook to fetch purchase stats for multiple wishlists at once
 */
export function useMultipleWishlistPurchaseStats(wishlistIds: string[]) {
  const [statsMap, setStatsMap] = useState<Map<string, PurchaseStats>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!wishlistIds.length) {
        setStatsMap(new Map());
        setLoading(false);
        return;
      }

      try {
        // Fetch all purchase records for these wishlists
        const { data: purchaseData, error: purchaseError } = await supabase
          .from("wishlist_item_purchases")
          .select("wishlist_id")
          .in("wishlist_id", wishlistIds);

        if (purchaseError) {
          console.error("Error fetching purchase data:", purchaseError);
          setLoading(false);
          return;
        }

        // Count purchases per wishlist
        const purchaseCounts = new Map<string, number>();
        purchaseData?.forEach(record => {
          const current = purchaseCounts.get(record.wishlist_id) || 0;
          purchaseCounts.set(record.wishlist_id, current + 1);
        });

        // Fetch item counts for all wishlists
        const { data: itemData, error: itemsError } = await supabase
          .from("wishlist_items")
          .select("wishlist_id")
          .in("wishlist_id", wishlistIds);

        if (itemsError) {
          console.error("Error fetching items data:", itemsError);
          setLoading(false);
          return;
        }

        // Count items per wishlist
        const itemCounts = new Map<string, number>();
        itemData?.forEach(record => {
          const current = itemCounts.get(record.wishlist_id) || 0;
          itemCounts.set(record.wishlist_id, current + 1);
        });

        // Build stats map
        const newStatsMap = new Map<string, PurchaseStats>();
        wishlistIds.forEach(id => {
          const total = itemCounts.get(id) || 0;
          const purchased = purchaseCounts.get(id) || 0;
          const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0;
          
          newStatsMap.set(id, {
            totalItems: total,
            purchasedItems: purchased,
            percentage
          });
        });

        setStatsMap(newStatsMap);
      } catch (err) {
        console.error("Error fetching multiple wishlist stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [wishlistIds.join(",")]);

  return { statsMap, loading };
}
