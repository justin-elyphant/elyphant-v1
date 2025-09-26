/*
 * ========================================================================
 * 🗂️ CART PERSISTENCE UTILITIES
 * ========================================================================
 * 
 * Utilities for modern cart persistence following e-commerce best practices:
 * - Guest carts persist for 30 days with automatic cleanup
 * - User carts sync across devices via server storage
 * - Cart preservation during logout for better UX
 * ========================================================================
 */

import { supabase } from "@/integrations/supabase/client";

export interface CartData {
  items: any[];
  expiresAt: number;
  version: number;
}

/**
 * Clean up expired cart data from localStorage
 */
export const cleanupExpiredCarts = (): void => {
  try {
    const keysToRemove: string[] = [];
    const currentTime = Date.now();
    
    // Find all cart-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cart_') || key === 'guest_cart')) {
        try {
          const cartData = localStorage.getItem(key);
          if (cartData) {
            const parsed = JSON.parse(cartData);
            // Check if it has expiration and is expired
            if (parsed.expiresAt && currentTime > parsed.expiresAt) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse it, it's probably corrupted - remove it
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove expired carts
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[CART CLEANUP] Removed expired cart: ${key}`);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`[CART CLEANUP] Cleaned up ${keysToRemove.length} expired cart(s)`);
    }
  } catch (error) {
    console.error('Error during cart cleanup:', error);
  }
};

/**
 * Get cart expiration status
 */
export const getCartExpirationInfo = (cartKey: string): {
  isExpired: boolean;
  expiresAt?: Date;
  daysRemaining?: number;
} => {
  try {
    const cartData = localStorage.getItem(cartKey);
    if (!cartData) {
      return { isExpired: false };
    }
    
    const parsed = JSON.parse(cartData);
    if (!parsed.expiresAt) {
      return { isExpired: false };
    }
    
    const expiresAt = new Date(parsed.expiresAt);
    const isExpired = Date.now() > parsed.expiresAt;
    const daysRemaining = Math.max(0, Math.ceil((parsed.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
    
    return {
      isExpired,
      expiresAt,
      daysRemaining
    };
  } catch (error) {
    console.error('Error checking cart expiration:', error);
    return { isExpired: true }; // Assume expired if we can't parse
  }
};

/**
 * Clean up server-side cart data for user (admin function)
 */
export const cleanupServerCarts = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_carts')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    console.log(`[SERVER CLEANUP] Cleaned up server cart for user ${userId}`);
  } catch (error) {
    console.error('Error cleaning up server cart:', error);
  }
};

/**
 * Initialize cart persistence cleanup on app start
 */
export const initializeCartCleanup = (): void => {
  // Clean up expired carts immediately
  cleanupExpiredCarts();
  
  // Set up periodic cleanup (every hour)
  setInterval(cleanupExpiredCarts, 60 * 60 * 1000);
  
  console.log('[CART PERSISTENCE] Initialized cart cleanup system');
};