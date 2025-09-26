/*
 * ========================================================================
 * 🔐 CART SECURITY UTILITIES
 * ========================================================================
 * 
 * Utilities for maintaining cart data isolation and preventing privacy leaks.
 * These utilities handle emergency cleanup scenarios and security validation.
 * 
 * SECURITY CRITICAL: These functions prevent user cart data from leaking
 * between different user accounts.
 * ========================================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Emergency cart data cleanup - removes ALL cart data from localStorage
 * Use this if cart data isolation has been compromised
 */
export const emergencyCartCleanup = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // Find all cart-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cart_') || key === 'guest_cart')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all cart data
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[EMERGENCY CLEANUP] Removed: ${key}`);
    });
    
    // Notify user
    toast.success('Cart data cleared for security');
    
    // Force page reload to reinitialize cart
    window.location.reload();
  } catch (error) {
    console.error('Emergency cart cleanup failed:', error);
    toast.error('Failed to clear cart data');
  }
};

/**
 * Validate that current cart belongs to current user
 * Returns true if cart is properly isolated, false if there's a security issue
 */
export const validateCartSecurity = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check for any suspicious cart keys in localStorage
    const suspiciousKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cart_')) {
        if (user) {
          // If user is logged in, only their cart and preserved cart should exist
          const expectedKey = `cart_${user.id}`;
          const preservedKey = `cart_${user.id}_preserved`;
          if (key !== expectedKey && key !== `${expectedKey}_version` && key !== preservedKey) {
            suspiciousKeys.push(key);
          }
        } else {
          // If no user is logged in, no user cart should exist (except preserved ones)
          if (!key.includes('_preserved')) {
            suspiciousKeys.push(key);
          }
        }
      }
    }
    
    if (suspiciousKeys.length > 0) {
      console.warn('[CART SECURITY] Suspicious cart keys found:', suspiciousKeys);
      
      // Clean up suspicious keys
      suspiciousKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[CART SECURITY] Removed suspicious key: ${key}`);
      });
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Cart security validation failed:', error);
    return false;
  }
};

/**
 * Get debug information about current cart state for troubleshooting
 */
export const getCartSecurityDebugInfo = async (): Promise<object> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const cartKeys: string[] = [];
    const allKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        allKeys.push(key);
        if (key.startsWith('cart_') || key === 'guest_cart') {
          cartKeys.push(key);
        }
      }
    }
    
    return {
      currentUser: user?.id || 'anonymous',
      cartKeys,
      expectedCartKey: user ? `cart_${user.id}` : 'guest_cart',
      totalLocalStorageKeys: allKeys.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get cart debug info:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Force reinitialize cart system - useful for debugging cart issues
 */
export const forceCartReinitialize = (): void => {
  try {
    // Clear all cart data
    emergencyCartCleanup();
    
    // The page reload in emergencyCartCleanup will reinitialize the cart system
  } catch (error) {
    console.error('Failed to force cart reinitialize:', error);
    toast.error('Failed to reinitialize cart system');
  }
};