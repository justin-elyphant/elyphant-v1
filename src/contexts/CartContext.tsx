
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

// Keep exact same interface for zero UI disruption
export interface CartItem {
  product: Product;
  quantity: number;
  recipientAssignment?: RecipientAssignment;
}

interface CartContextType {
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
  updateRecipientAssignment: (productId: string, updates: Partial<RecipientAssignment>) => void;
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

  /*
   * ========================================================================
   * CART OPERATIONS (IDENTICAL INTERFACE, UNIFIED BACKEND)
   * ========================================================================
   */

  const addToCart = async (product: Product, quantity: number = 1) => {
    await serviceAddToCart(product.product_id, quantity);
  };

  const removeFromCart = (productId: string) => {
    serviceRemoveFromCart(productId);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    serviceUpdateQuantity(productId, quantity);
  };

  const clearCart = () => {
    serviceClearCart();
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

  const updateRecipientAssignment = (productId: string, updates: Partial<RecipientAssignment>) => {
    const item = cartItems.find(item => item.product.product_id === productId);
    if (item && item.recipientAssignment) {
      const updatedAssignment = { ...item.recipientAssignment, ...updates };
      serviceAssignToRecipient(productId, updatedAssignment);
    }
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
