
/*
 * ========================================================================
 * 🔄 CART CONTEXT - MIGRATED TO UNIFIED PAYMENT SERVICE
 * ========================================================================
 * 
 * This context now uses UnifiedPaymentService as its backend while
 * maintaining the exact same interface for zero UI disruption.
 * 
 * ⚠️  MIGRATION STATUS - WEEK 2:
 * - Backend: Uses UnifiedPaymentService for all operations
 * - Interface: IDENTICAL to original CartContext (zero changes)
 * - Features: All recipient management and complex functionality preserved
 * - Performance: Improved through unified service architecture
 * 
 * 🔗 DEPENDENCIES:
 * - UnifiedPaymentService: Core cart and payment orchestration
 * - useUnifiedCart: React hooks for service integration
 * 
 * Week 2 Implementation - 2025-01-23
 * ========================================================================
 */

import React, { createContext, useContext, useMemo } from 'react';
import { Product } from '@/types/product';
import { RecipientAssignment, DeliveryGroup } from '@/types/recipient';
import { useAuth } from '@/contexts/auth';
import { useUnifiedCart } from '@/hooks/useUnifiedPayment';
import { triggerHapticFeedback } from '@/utils/haptics';

// Keep exact same interface for zero UI disruption
export interface CartItem {
  product: Product;
  quantity: number;
  recipientAssignment?: RecipientAssignment;
  variationText?: string;
  selectedVariations?: string;
  // Wishlist tracking metadata
  wishlist_id?: string;
  wishlist_item_id?: string;
  // Registry-style fulfillment: ship to wishlist owner's address
  wishlist_owner_id?: string;
  wishlist_owner_name?: string;
  wishlist_owner_shipping?: any;
}

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  deliveryGroups: DeliveryGroup[];
  addToCart: (product: Product, quantity?: number, wishlistMetadata?: { wishlist_id: string; wishlist_item_id: string; wishlist_owner_id?: string; wishlist_owner_name?: string; wishlist_owner_shipping?: any }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  transferGuestCart: () => void;
  assignItemToRecipient: (productId: string, recipientAssignment: RecipientAssignment) => void;
  unassignItemFromRecipient: (productId: string) => void;
  updateRecipientAssignment: (productId: string, updates: Partial<RecipientAssignment>, silent?: boolean) => void;
  updateDeliveryGroupScheduling: (groupId: string, scheduledDate: string | null) => void;
  getItemsByRecipient: () => Map<string, CartItem[]>;
  getUnassignedItems: () => CartItem[];
  assignItemsToNewRecipient: (productIds: string[], recipientData: any) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

/*
 * ========================================================================
 * MIGRATED CART PROVIDER - UNIFIED SERVICE BACKEND
 * ========================================================================
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Use UnifiedPaymentService via hooks - this is the key migration
  // Add error boundary to prevent context failures
  let cartHookResult;
  try {
    cartHookResult = useUnifiedCart();
    console.log('[CartProvider] Successfully initialized useUnifiedCart hook');
  } catch (error) {
    console.error('[CartProvider] Failed to initialize useUnifiedCart, using fallback:', error);
    // Provide a complete fallback state that matches the interface
    cartHookResult = {
      cartItems: [],
      cartTotal: 0,
      itemCount: 0,
      isProcessing: false,
      addToCart: async (productOrId: string | any, quantity?: number) => {
        console.warn('[CartProvider] Cart addToCart called but service unavailable');
      },
      removeFromCart: (productId: string) => {
        console.warn('[CartProvider] Cart removeFromCart called but service unavailable');
      },
      updateQuantity: (productId: string, quantity: number) => {
        console.warn('[CartProvider] Cart updateQuantity called but service unavailable');
      },
      clearCart: () => {
        console.warn('[CartProvider] Cart clearCart called but service unavailable');
      },
      assignItemToRecipient: (productId: string, recipient: any) => {
        console.warn('[CartProvider] Cart assignItemToRecipient called but service unavailable');
      },
      refreshCart: () => {
        console.warn('[CartProvider] Cart refreshCart called but service unavailable');
      }
    };
  }

  const {
    cartItems,
    cartTotal,
    itemCount,
    addToCart: serviceAddToCart,
    removeFromCart: serviceRemoveFromCart,
    updateQuantity: serviceUpdateQuantity,
    clearCart: serviceClearCart,
    assignItemToRecipient: serviceAssignToRecipient
  } = cartHookResult;

  /*
   * ========================================================================
   * CART OPERATIONS (IDENTICAL INTERFACE, UNIFIED BACKEND)
   * ========================================================================
   */

  const addToCart = async (product: Product, quantity: number = 1, wishlistMetadata?: { wishlist_id: string; wishlist_item_id: string; wishlist_owner_id?: string; wishlist_owner_name?: string; wishlist_owner_shipping?: any }) => {
    await serviceAddToCart(product, quantity, wishlistMetadata);
    triggerHapticFeedback('success'); // Native haptic on add to cart
  };

  const removeFromCart = (productId: string) => {
    serviceRemoveFromCart(productId);
    triggerHapticFeedback('warning'); // Native haptic on remove
  };

  const updateQuantity = (productId: string, quantity: number) => {
    serviceUpdateQuantity(productId, quantity);
    triggerHapticFeedback('light'); // Subtle haptic on quantity change
  };

  const clearCart = () => {
    serviceClearCart();
    triggerHapticFeedback('warning'); // Native haptic on clear
  };

  const getItemCount = () => {
    return itemCount;
  };

  /*
   * ========================================================================
   * RECIPIENT MANAGEMENT (PRESERVED COMPLEX FUNCTIONALITY)
   * ========================================================================
   */

  const assignItemToRecipient = (productId: string, recipientAssignment: RecipientAssignment) => {
    serviceAssignToRecipient(productId, recipientAssignment);
  };

  const unassignItemFromRecipient = (productId: string) => {
    // Find the item and clear its recipient assignment
    const item = cartItems.find(item => item.product.product_id === productId);
    if (item && item.recipientAssignment) {
      serviceAssignToRecipient(productId, undefined as any);
    }
  };

  const updateRecipientAssignment = (productId: string, updates: Partial<RecipientAssignment>, silent: boolean = false) => {
    const item = cartItems.find(item => item.product.product_id === productId);
    if (item && item.recipientAssignment) {
      const updatedAssignment = { ...item.recipientAssignment, ...updates };
      serviceAssignToRecipient(productId, updatedAssignment, silent);
    }
  };

  const updateDeliveryGroupScheduling = (groupId: string, scheduledDate: string | null) => {
    // Update all items in the delivery group with the new scheduled date
    const itemsInGroup = cartItems.filter(item => 
      item.recipientAssignment?.deliveryGroupId === groupId
    );
    
    console.log(`📅 [CartContext] Updating delivery group ${groupId} scheduling:`, {
      scheduledDate,
      itemCount: itemsInGroup.length
    });
    
    itemsInGroup.forEach(item => {
      if (item.recipientAssignment) {
        const updatedAssignment = { 
          ...item.recipientAssignment, 
          scheduledDeliveryDate: scheduledDate 
        };
        serviceAssignToRecipient(item.product.product_id, updatedAssignment);
      }
    });
  };

  const getItemsByRecipient = (): Map<string, CartItem[]> => {
    const groupedItems = new Map<string, CartItem[]>();
    
    cartItems.forEach(item => {
      if (item.recipientAssignment) {
        const key = item.recipientAssignment.connectionId;
        if (!groupedItems.has(key)) {
          groupedItems.set(key, []);
        }
        groupedItems.get(key)!.push(item);
      }
    });
    
    return groupedItems;
  };

  const getUnassignedItems = (): CartItem[] => {
    return cartItems.filter(item => !item.recipientAssignment);
  };

  const assignItemsToNewRecipient = (productIds: string[], recipientData: any) => {
    const deliveryGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const recipientAssignment: RecipientAssignment = {
      connectionId: recipientData.id,
      connectionName: recipientData.name,
      deliveryGroupId,
      shippingAddress: recipientData.address
    };

    productIds.forEach(productId => {
      serviceAssignToRecipient(productId, recipientAssignment);
    });
  };

  /*
   * ========================================================================
   * DELIVERY GROUPS (COMPUTED FROM CART ITEMS)
   * ========================================================================
   */

  const deliveryGroups: DeliveryGroup[] = useMemo(() => {
    return Array.from(getItemsByRecipient().entries()).map(
      ([connectionId, items]) => {
        const firstItem = items[0];
        const assignment = firstItem.recipientAssignment!;
        
        const deliveryGroup = {
          id: assignment.deliveryGroupId,
          connectionId,
          connectionName: assignment.connectionName,
          items: items.map(item => item.product.product_id),
          giftMessage: assignment.giftMessage,
          scheduledDeliveryDate: assignment.scheduledDeliveryDate,
          shippingAddress: assignment.shippingAddress,
          // Privacy control
          isPrivateAddress: assignment.isPrivateAddress,
          connectionStatus: assignment.connectionStatus,
          // Include verification data from assignment
          address_verified: assignment.address_verified,
          address_verification_method: assignment.address_verification_method,
          address_verified_at: assignment.address_verified_at,
          address_last_updated: assignment.address_last_updated
        };
        
        console.log(`🔍 [CartContext] Creating delivery group for ${assignment.connectionName}:`, {
          address_verified: assignment.address_verified,
          verification_method: assignment.address_verification_method,
          verified_at: assignment.address_verified_at
        });
        
        return deliveryGroup;
      }
    );
  }, [cartItems]);

  /*
   * ========================================================================
   * GUEST CART TRANSFER (HANDLED BY UNIFIED SERVICE)
   * ========================================================================
   */

  const transferGuestCart = () => {
    // The UnifiedPaymentService handles this automatically via auth listeners
    console.log('Guest cart transfer managed by UnifiedPaymentService');
  };

  /*
   * ========================================================================
   * CONTEXT VALUE (IDENTICAL INTERFACE)
   * ========================================================================
   */

  const contextValue = useMemo(() => ({
    cartItems,
    cartTotal,
    deliveryGroups,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    transferGuestCart,
    assignItemToRecipient,
    unassignItemFromRecipient,
    updateRecipientAssignment,
    updateDeliveryGroupScheduling,
    getItemsByRecipient,
    getUnassignedItems,
    assignItemsToNewRecipient,
  }), [
    cartItems,
    cartTotal,
    deliveryGroups,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    transferGuestCart,
    assignItemToRecipient,
    unassignItemFromRecipient,
    updateRecipientAssignment,
    updateDeliveryGroupScheduling,
    getItemsByRecipient,
    getUnassignedItems,
    assignItemsToNewRecipient
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
