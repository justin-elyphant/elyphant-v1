
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/types/product';
import { RecipientAssignment, DeliveryGroup } from '@/types/recipient';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

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

const getCartKey = (userId?: string) => {
  return userId ? `cart_${userId}` : 'guest_cart';
};

// Debounce localStorage saves to improve performance
const useDebounceLocalStorage = (key: string, value: any, delay: number = 500) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [key, value, delay]);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartKey = useMemo(() => getCartKey(user?.id), [user?.id]);

  // Debounced localStorage save
  useDebounceLocalStorage(cartKey, cartItems);

  // Load cart from localStorage on mount and user change
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        localStorage.removeItem(cartKey);
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [cartKey]);

  // Memoized calculations to prevent unnecessary recalculations
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

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

  // Transfer guest cart to authenticated user
  const transferGuestCart = useCallback(() => {
    if (!user) return;

    const guestCartKey = getCartKey();
    const guestCart = localStorage.getItem(guestCartKey);
    
    if (guestCart) {
      try {
        const guestItems = JSON.parse(guestCart);
        if (guestItems.length > 0) {
          const userCartKey = getCartKey(user.id);
          const userCart = localStorage.getItem(userCartKey);
          let mergedCart = guestItems;
          
          if (userCart) {
            const userItems = JSON.parse(userCart);
            const mergedMap = new Map();
            
            userItems.forEach((item: CartItem) => {
              mergedMap.set(item.product.product_id, item);
            });
            
            guestItems.forEach((item: CartItem) => {
              const existing = mergedMap.get(item.product.product_id);
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                mergedMap.set(item.product.product_id, item);
              }
            });
            
            mergedCart = Array.from(mergedMap.values());
          }
          
          setCartItems(mergedCart);
          localStorage.removeItem(guestCartKey);
          
          toast.success('Cart items transferred successfully!');
        }
      } catch (error) {
        console.error('Error transferring guest cart:', error);
      }
    }
  }, [user]);

  // Trigger cart transfer when user logs in
  useEffect(() => {
    if (user) {
      transferGuestCart();
    }
  }, [user, transferGuestCart]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.product_id === product.product_id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prev, { product, quantity }];
    });
    
    toast.success('Added to cart', {
      description: product.name || product.title
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.product_id !== productId));
    toast.success('Removed from cart');
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(cartKey);
    toast.success('Cart cleared');
  }, [cartKey]);

  const assignItemToRecipient = useCallback((productId: string, recipientAssignment: RecipientAssignment) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId
          ? { ...item, recipientAssignment }
          : item
      )
    );
    toast.success('Item assigned to recipient');
  }, []);

  const unassignItemFromRecipient = useCallback((productId: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId
          ? { ...item, recipientAssignment: undefined }
          : item
      )
    );
    toast.success('Item unassigned from recipient');
  }, []);

  const updateRecipientAssignment = useCallback((productId: string, updates: Partial<RecipientAssignment>) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId && item.recipientAssignment
          ? { 
              ...item, 
              recipientAssignment: { ...item.recipientAssignment, ...updates }
            }
          : item
      )
    );
  }, []);

  const assignItemsToNewRecipient = useCallback((productIds: string[], recipientData: any) => {
    const deliveryGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const recipientAssignment: RecipientAssignment = {
      connectionId: recipientData.id,
      connectionName: recipientData.name,
      deliveryGroupId,
      shippingAddress: recipientData.address
    };

    setCartItems(prev =>
      prev.map(item =>
        productIds.includes(item.product.product_id)
          ? { ...item, recipientAssignment }
          : item
      )
    );
    
    toast.success(`Items assigned to ${recipientData.name}`);
  }, []);

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
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
