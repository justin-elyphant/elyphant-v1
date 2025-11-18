/*
 * ========================================================================
 * 🔗 UNIFIED PAYMENT HOOKS - REACT INTEGRATION
 * ========================================================================
 * 
 * React hooks for integrating with UnifiedPaymentService.
 * These hooks provide reactive state management for cart and payment operations.
 * 
 * ⚠️  CRITICAL: These hooks replace CartContext functionality
 * Components should use these hooks instead of direct CartContext access.
 * 
 * 🔗 DEPENDENCIES:
 * - UnifiedPaymentService: Core payment orchestration
 * - React hooks: useState, useEffect, useCallback
 * 
 * Last major update: 2025-01-23 (Week 1 Implementation)
 * ========================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedPaymentService } from '@/services/payment/UnifiedPaymentService';
import { CartItem } from '@/contexts/CartContext';
import { RecipientAssignment } from '@/types/recipient';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import { Product } from '@/types/product';

// ============================================================================
// CART HOOK
// ============================================================================

export interface UseUnifiedCartReturn {
  cartItems: CartItem[];
  cartTotal: number;
  itemCount: number;
  isProcessing: boolean;
  addToCart: (productOrId: string | Product, quantity?: number, wishlistMetadata?: { wishlist_id: string; wishlist_item_id: string }) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  assignItemToRecipient: (productId: string, recipient: RecipientAssignment, silent?: boolean) => void;
  refreshCart: () => void;
}

/**
 * Main cart hook that provides reactive cart state and operations
 * Replaces useCart from CartContext
 */
export const useUnifiedCart = (): UseUnifiedCartReturn => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update local state from service
  const refreshCart = useCallback(() => {
    setCartItems(unifiedPaymentService.getCartItems());
    setCartTotal(unifiedPaymentService.getCartTotal());
    setItemCount(unifiedPaymentService.getItemCount());
    setIsProcessing(unifiedPaymentService.isCurrentlyProcessing());
  }, []);

  // Listen for cart changes from service
  useEffect(() => {
    const handleCartChange = () => {
      refreshCart();
    };

    window.addEventListener('unifiedPaymentCartChange', handleCartChange);
    
    // Initial load
    refreshCart();

    return () => {
      window.removeEventListener('unifiedPaymentCartChange', handleCartChange);
    };
  }, [refreshCart]);

  // Cart operations
  const addToCart = useCallback(async (productOrId: string | Product, quantity: number = 1, wishlistMetadata?: { wishlist_id: string; wishlist_item_id: string }) => {
    try {
      setIsProcessing(true);
      await unifiedPaymentService.addToCart(productOrId, quantity, wishlistMetadata);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    unifiedPaymentService.removeFromCart(productId);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    unifiedPaymentService.updateQuantity(productId, quantity);
  }, []);

  const clearCart = useCallback(async () => {
    await unifiedPaymentService.clearCart();
  }, []);

  const assignItemToRecipient = useCallback((productId: string, recipient: RecipientAssignment, silent: boolean = false) => {
    unifiedPaymentService.assignItemToRecipient(productId, recipient, silent);
  }, []);

  return {
    cartItems,
    cartTotal,
    itemCount,
    isProcessing,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    assignItemToRecipient,
    refreshCart
  };
};

// ============================================================================
// LEGACY PAYMENT HOOK - REMOVED
// ============================================================================
// 
// ❌ useUnifiedPayment hook removed in Phase 5 cleanup
// ✅ Production system uses Stripe Checkout Sessions exclusively
// ✅ All payments via create-checkout-session edge function
// ✅ Orders created by stripe-webhook-v2 (checkout.session.completed)
//
// If you need payment processing, use:
// - UnifiedCheckoutForm with create-checkout-session
// - UnifiedPaymentMethodManager for saved cards
// ============================================================================

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy compatibility hook that mimics CartContext interface
 * Use this for gradual migration from CartContext to UnifiedPaymentService
 */
export const useCartCompatibility = () => {
  const cart = useUnifiedCart();
  
  return {
    ...cart,
    // Legacy method names for backwards compatibility
    getItemCount: () => cart.itemCount,
    getItemsByRecipient: () => {
      // Implementation for getting items grouped by recipient
      const groupedItems = new Map();
      cart.cartItems.forEach(item => {
        if (item.recipientAssignment) {
          const key = item.recipientAssignment.connectionId;
          if (!groupedItems.has(key)) {
            groupedItems.set(key, []);
          }
          groupedItems.get(key).push(item);
        }
      });
      return groupedItems;
    },
    getUnassignedItems: () => cart.cartItems.filter(item => !item.recipientAssignment),
    transferGuestCart: () => {
      // Guest cart transfer logic can be implemented here
      console.log('Guest cart transfer - to be implemented');
    },
    deliveryGroups: [], // To be computed from cart items
    assignItemsToNewRecipient: (productIds: string[], recipientData: any) => {
      // Implementation for bulk recipient assignment
      console.log('Bulk recipient assignment - to be implemented');
    },
    unassignItemFromRecipient: (productId: string) => {
      // Implementation for unassigning recipient
      console.log('Unassign recipient - to be implemented');
    },
    updateRecipientAssignment: (productId: string, updates: Partial<RecipientAssignment>) => {
      // Implementation for updating recipient assignment
      console.log('Update recipient assignment - to be implemented');
    }
  };
};