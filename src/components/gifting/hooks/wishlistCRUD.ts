
import { supabase } from "@/integrations/supabase/client";
import { Wishlist, WishlistItem } from "@/types/profile";
import { toast } from "sonner";

export async function createWishlist(userId: string, title: string, description = "", category?: string, tags?: string[], priority?: "low" | "medium" | "high"): Promise<Wishlist | null> {
  try {
    const { data, error } = await supabase
      .from("wishlists")
      .insert([
        {
          user_id: userId,
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
    toast.success("Wishlist created!");
    return { ...data, items: [] };
  } catch (err: any) {
    toast.error("Failed to create wishlist");
    return null;
  }
}

// Delete wishlist and its items
export async function deleteWishlist(wishlistId: string): Promise<boolean> {
  try {
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId);
    const { error } = await supabase.from("wishlists").delete().eq("id", wishlistId);
    if (error) throw error;
    toast.success("Wishlist deleted!");
    return true;
  } catch {
    toast.error("Failed to delete wishlist");
    return false;
  }
}

// Add item to wishlist
export async function addToWishlist(wishlistId: string, item: Omit<WishlistItem, "id" | "created_at">): Promise<WishlistItem | null> {
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
    toast.success("Item added to wishlist!");
    return data;
  } catch {
    toast.error("Failed to add item to wishlist");
    return null;
  }
}

// Remove item from wishlist
export async function removeFromWishlist(wishlistId: string, itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", itemId);
    if (error) throw error;
    toast.success("Item removed from wishlist");
    return true;
  } catch {
    toast.error("Failed to remove item from wishlist");
    return false;
  }
}
