/*
 * ========================================================================
 * 🔄 UNIFIED CART CONTEXT - MIGRATION WRAPPER
 * ========================================================================
 * 
 * This context provides a migration path from CartContext to UnifiedPaymentService.
 * It maintains the exact same interface as CartContext while using the new service.
 * 
 * ⚠️  MIGRATION STRATEGY:
 * - Week 1: Create this wrapper with identical interface
 * - Week 2: Gradually migrate components to use this context
 * - Week 3: Update protection measures and documentation
 * - Week 4-5: Remove old CartContext after full migration
 * 
 * 🔗 DEPENDENCIES:
 * - UnifiedPaymentService: Core payment and cart orchestration
 * - useUnifiedCart: React hooks for service integration
 * 
 * Last major update: 2025-01-23 (Week 1 Implementation)
 * ========================================================================
 */

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Product } from '@/types/product';
import { RecipientAssignment, DeliveryGroup } from '@/types/recipient';
import { useAuth } from '@/contexts/auth';
import { useUnifiedCart } from '@/hooks/useUnifiedPayment';
import { CartItem } from '@/contexts/CartContext';

// ============================================================================
// INTERFACE (IDENTICAL TO ORIGINAL CARTCONTEXT)
// ============================================================================

interface UnifiedCartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  deliveryGroups: DeliveryGroup[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  transferGuestCart: () => void;
  assignItemToRecipient: (productId: string, recipientAssignment: RecipientAssignment) => void;
  unassignItemFromRecipient: (productId: string) => void;
  updateRecipientAssignment: (productId: string, updates: Partial<RecipientAssignment>, silent?: boolean) => void;
  getItemsByRecipient: () => Map<string, CartItem[]>;
  getUnassignedItems: () => CartItem[];
  assignItemsToNewRecipient: (productIds: string[], recipientData: any) => void;
}

const UnifiedCartContext = createContext<UnifiedCartContextType | undefined>(undefined);

// ============================================================================
// UNIFIED CART PROVIDER
// ============================================================================

export const UnifiedCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    cartItems,
    cartTotal,
    itemCount,
    addToCart: serviceAddToCart,
    removeFromCart: serviceRemoveFromCart,
    updateQuantity: serviceUpdateQuantity,
    clearCart: serviceClearCart,
    assignItemToRecipient: serviceAssignToRecipient
  } = useUnifiedCart();

  // ============================================================================
  // CART OPERATIONS (MAINTAINING IDENTICAL INTERFACE)
  // ============================================================================

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      await serviceAddToCart(product.product_id, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [serviceAddToCart]);

  const removeFromCart = useCallback((productId: string) => {
    serviceRemoveFromCart(productId);
  }, [serviceRemoveFromCart]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    serviceUpdateQuantity(productId, quantity);
  }, [serviceUpdateQuantity]);

  const clearCart = useCallback(() => {
    serviceClearCart();
  }, [serviceClearCart]);

  const getItemCount = useCallback(() => {
    return itemCount;
  }, [itemCount]);

  // ============================================================================
  // RECIPIENT MANAGEMENT (PRESERVING COMPLEX FUNCTIONALITY)
  // ============================================================================

  const assignItemToRecipient = useCallback((productId: string, recipientAssignment: RecipientAssignment) => {
    serviceAssignToRecipient(productId, recipientAssignment);
  }, [serviceAssignToRecipient]);

  const unassignItemFromRecipient = useCallback((productId: string) => {
    // Find the item and remove its recipient assignment
    const item = cartItems.find(item => item.product.product_id === productId);
    if (item && item.recipientAssignment) {
      // Create a new assignment that clears the recipient
      serviceAssignToRecipient(productId, {} as RecipientAssignment);
    }
  }, [cartItems, serviceAssignToRecipient]);

  const updateRecipientAssignment = useCallback((productId: string, updates: Partial<RecipientAssignment>, silent: boolean = false) => {
    const item = cartItems.find(item => item.product.product_id === productId);
    if (item && item.recipientAssignment) {
      const updatedAssignment = { ...item.recipientAssignment, ...updates };
      serviceAssignToRecipient(productId, updatedAssignment, silent);
    }
  }, [cartItems, serviceAssignToRecipient]);

  const getItemsByRecipient = useCallback((): Map<string, CartItem[]> => {
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
  }, [cartItems]);

  const getUnassignedItems = useCallback((): CartItem[] => {
    return cartItems.filter(item => !item.recipientAssignment);
  }, [cartItems]);

  const assignItemsToNewRecipient = useCallback((productIds: string[], recipientData: any) => {
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
  }, [serviceAssignToRecipient]);

  // ============================================================================
  // DELIVERY GROUPS (COMPUTED FROM CART ITEMS)
  // ============================================================================

  const deliveryGroups: DeliveryGroup[] = useMemo(() => {
    return Array.from(getItemsByRecipient().entries()).map(
      ([connectionId, items]) => {
        const firstItem = items[0];
        const assignment = firstItem.recipientAssignment!;
        
        return {
          id: assignment.deliveryGroupId,
          connectionId,
          connectionName: assignment.connectionName,
          items: items.map(item => item.product.product_id),
          giftMessage: assignment.giftMessage,
          scheduledDeliveryDate: assignment.scheduledDeliveryDate,
          shippingAddress: assignment.shippingAddress
        };
      }
    );
  }, [getItemsByRecipient]);

  // ============================================================================
  // GUEST CART TRANSFER (PLACEHOLDER)
  // ============================================================================

  const transferGuestCart = useCallback(() => {
    if (!user) return;

    // The UnifiedPaymentService handles guest cart transfer automatically
    // through its auth state change listeners, so this is mainly for 
    // compatibility with the CartContext interface
    console.log('Guest cart transfer handled automatically by UnifiedPaymentService');
  }, [user]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

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
    getItemsByRecipient,
    getUnassignedItems,
    assignItemsToNewRecipient,
  }), [
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
    getItemsByRecipient,
    getUnassignedItems,
    assignItemsToNewRecipient,
  ]);

  return (
    <UnifiedCartContext.Provider value={contextValue}>
      {children}
    </UnifiedCartContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useUnifiedCartContext = () => {
  const context = useContext(UnifiedCartContext);
  if (!context) {
    throw new Error('useUnifiedCartContext must be used within a UnifiedCartProvider');
  }
  return context;
};

export default UnifiedCartProvider;