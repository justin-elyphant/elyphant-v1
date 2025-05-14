
import { WishlistItem, Wishlist, normalizeWishlist, normalizeWishlistItem } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Create a new wishlist
export async function createWishlist(userId: string, title: string, description?: string): Promise<Wishlist | null> {
  try {
    // Fetch existing wishlists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('wishlists')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching wishlists:", fetchError);
      return null;
    }
    
    // Create new wishlist with default values
    const newWishlist: Wishlist = normalizeWishlist({
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      description: description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: false,
      items: []
    });
    
    // Add to existing wishlists or create new array
    const wishlists = Array.isArray(profile?.wishlists) ? [...profile.wishlists, newWishlist] : [newWishlist];
    
    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        wishlists,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating wishlists:", updateError);
      return null;
    }
    
    return newWishlist;
  } catch (error) {
    console.error("Error creating wishlist:", error);
    return null;
  }
}

// Add item to wishlist
export async function addToWishlist(
  userId: string, 
  wishlistId: string, 
  product: any
): Promise<WishlistItem | null> {
  try {
    // Fetch existing wishlists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('wishlists')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching wishlists:", fetchError);
      return null;
    }
    
    // Find target wishlist
    const wishlists = Array.isArray(profile?.wishlists) ? profile.wishlists : [];
    const wishlistIndex = wishlists.findIndex(list => list.id === wishlistId);
    
    if (wishlistIndex === -1) {
      toast.error("Wishlist not found");
      return null;
    }
    
    // Create new item
    const newItem: WishlistItem = normalizeWishlistItem({
      id: crypto.randomUUID(),
      wishlist_id: wishlistId,
      product_id: product.id,
      title: product.title || product.name,
      name: product.title || product.name,
      price: product.price,
      brand: product.brand,
      image_url: product.image || product.image_url,
      added_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    
    // Add item to wishlist
    wishlists[wishlistIndex].items = [...wishlists[wishlistIndex].items, newItem];
    wishlists[wishlistIndex].updated_at = new Date().toISOString();
    
    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        wishlists,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating wishlists:", updateError);
      return null;
    }
    
    return newItem;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return null;
  }
}

// Normalize wishlist data to ensure consistency
export function normalizeWishlistData(wishlists: any[] | null): Wishlist[] {
  if (!Array.isArray(wishlists) || wishlists.length === 0) {
    return [];
  }
  
  return wishlists.map(list => normalizeWishlist(list));
}
