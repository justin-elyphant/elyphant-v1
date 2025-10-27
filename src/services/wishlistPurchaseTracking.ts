import { supabase } from "@/integrations/supabase/client";

export interface WishlistPurchase {
  id: string;
  wishlist_id: string;
  item_id: string;
  product_id: string;
  purchaser_user_id?: string;
  purchaser_name?: string;
  is_anonymous: boolean;
  purchased_at: string;
  order_id?: string;
  quantity: number;
  price_paid?: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistPurchaseStats {
  totalItems: number;
  purchasedCount: number;
  percentPurchased: number;
  totalValue: number;
  purchasedValue: number;
  purchasesByCategory: Record<string, number>;
}

/**
 * Service for tracking wishlist item purchases
 * Prevents duplicate gift purchases and powers the Gift Tracker
 */
export class WishlistPurchaseTrackingService {
  /**
   * Mark an item as purchased (called after successful order)
   */
  static async markItemAsPurchased(params: {
    wishlistId: string;
    itemId: string;
    productId: string;
    purchaserUserId?: string;
    purchaserName?: string;
    isAnonymous?: boolean;
    orderId?: string;
    quantity?: number;
    pricePaid?: number;
  }): Promise<{ success: boolean; purchase?: WishlistPurchase; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('wishlist_item_purchases')
        .insert({
          wishlist_id: params.wishlistId,
          item_id: params.itemId,
          product_id: params.productId,
          purchaser_user_id: params.purchaserUserId,
          purchaser_name: params.purchaserName,
          is_anonymous: params.isAnonymous || false,
          order_id: params.orderId,
          quantity: params.quantity || 1,
          price_paid: params.pricePaid,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, purchase: data as WishlistPurchase };
    } catch (error: any) {
      console.error('Error marking item as purchased:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all purchases for a specific wishlist
   */
  static async getWishlistPurchases(
    wishlistId: string
  ): Promise<{ success: boolean; purchases?: WishlistPurchase[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('wishlist_item_purchases')
        .select('*')
        .eq('wishlist_id', wishlistId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      return { success: true, purchases: data as WishlistPurchase[] };
    } catch (error: any) {
      console.error('Error fetching wishlist purchases:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all purchases made by a specific user
   */
  static async getUserPurchases(
    userId: string
  ): Promise<{ success: boolean; purchases?: WishlistPurchase[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('wishlist_item_purchases')
        .select('*')
        .eq('purchaser_user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      return { success: true, purchases: data as WishlistPurchase[] };
    } catch (error: any) {
      console.error('Error fetching user purchases:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a specific item has been purchased
   */
  static async isItemPurchased(params: {
    wishlistId: string;
    itemId: string;
  }): Promise<{ isPurchased: boolean; purchase?: WishlistPurchase }> {
    try {
      const { data, error } = await supabase
        .from('wishlist_item_purchases')
        .select('*')
        .eq('wishlist_id', params.wishlistId)
        .eq('item_id', params.itemId)
        .maybeSingle();

      if (error) throw error;

      return {
        isPurchased: !!data,
        purchase: data as WishlistPurchase | undefined,
      };
    } catch (error: any) {
      console.error('Error checking item purchase status:', error);
      return { isPurchased: false };
    }
  }

  /**
   * Get purchase statistics for all wishlists
   * Used by the Gift Tracker component
   */
  static async getWishlistStats(params: {
    wishlistIds: string[];
    items: Array<{ id: string; price?: number; category?: string }>;
  }): Promise<WishlistPurchaseStats> {
    try {
      // Fetch all purchases for the given wishlists
      const { data: purchases, error } = await supabase
        .from('wishlist_item_purchases')
        .select('*')
        .in('wishlist_id', params.wishlistIds);

      if (error) throw error;

      const purchasedItemIds = new Set(purchases?.map(p => p.item_id) || []);
      
      // Calculate stats
      const totalItems = params.items.length;
      const purchasedCount = params.items.filter(item => 
        purchasedItemIds.has(item.id)
      ).length;
      
      const totalValue = params.items.reduce((sum, item) => sum + (item.price || 0), 0);
      const purchasedValue = params.items
        .filter(item => purchasedItemIds.has(item.id))
        .reduce((sum, item) => sum + (item.price || 0), 0);

      // Category breakdown
      const purchasesByCategory: Record<string, number> = {};
      params.items.forEach(item => {
        if (purchasedItemIds.has(item.id)) {
          const category = item.category || 'General';
          purchasesByCategory[category] = (purchasesByCategory[category] || 0) + 1;
        }
      });

      return {
        totalItems,
        purchasedCount,
        percentPurchased: totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0,
        totalValue,
        purchasedValue,
        purchasesByCategory,
      };
    } catch (error: any) {
      console.error('Error getting wishlist stats:', error);
      return {
        totalItems: params.items.length,
        purchasedCount: 0,
        percentPurchased: 0,
        totalValue: 0,
        purchasedValue: 0,
        purchasesByCategory: {},
      };
    }
  }

  /**
   * Remove a purchase record (e.g., if order was cancelled)
   */
  static async removePurchaseRecord(
    purchaseId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wishlist_item_purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error removing purchase record:', error);
      return { success: false, error: error.message };
    }
  }
}
