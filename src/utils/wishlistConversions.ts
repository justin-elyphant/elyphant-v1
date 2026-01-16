import { Product } from "@/types/product";
import { WishlistItem } from "@/types/profile";

/**
 * Converts a WishlistItem to a Product format compatible with the cart
 * Preserves wishlist metadata for purchase tracking
 */
export function convertWishlistItemToProduct(
  item: WishlistItem,
  wishlistId: string
): Product & { wishlist_id: string; wishlist_item_id: string } {
  return {
    // Core product fields
    product_id: item.product_id || item.id,
    title: item.name || item.title || "Product",
    name: item.name || item.title || "Product",
    price: item.price || 0,
    image: item.image_url || "/placeholder.svg",
    
    // Optional fields
    brand: item.brand || "",
    retailer: (item as any).retailer || "amazon",
    stars: (item as any).stars || (item as any).rating || 0,
    review_count: (item as any).review_count || (item as any).reviews || 0,
    
    // Source detection
    productSource: (item as any).product_source,
    
    // Wishlist tracking metadata
    wishlist_id: wishlistId,
    wishlist_item_id: item.id,
  };
}

/**
 * Calculate total price of wishlist items
 */
export function calculateWishlistTotal(items: WishlistItem[]): number {
  return items.reduce((total, item) => total + (item.price || 0), 0);
}

/**
 * Get IDs of items that have been purchased from a wishlist
 */
export async function fetchPurchasedItemIds(
  wishlistId: string,
  supabase: any
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("wishlist_item_purchases")
    .select("item_id")
    .eq("wishlist_id", wishlistId);

  if (error) {
    console.error("Failed to fetch purchased items:", error);
    return new Set();
  }

  return new Set(data?.map((row: any) => row.item_id) || []);
}
