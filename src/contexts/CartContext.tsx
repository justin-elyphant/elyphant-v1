import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage based on auth state
  useEffect(() => {
    const cartKey = getCartKey(user?.id);
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        localStorage.removeItem(cartKey);
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartKey = getCartKey(user?.id);
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
  }, [cartItems, user]);

  // Transfer guest cart to authenticated user
  const transferGuestCart = () => {
    if (!user) return;

    const guestCartKey = getCartKey();
    const guestCart = localStorage.getItem(guestCartKey);
    
    if (guestCart) {
      try {
        const guestItems = JSON.parse(guestCart);
        if (guestItems.length > 0) {
          // Merge guest cart with user cart (if any)
          const userCartKey = getCartKey(user.id);
          const userCart = localStorage.getItem(userCartKey);
          let mergedCart = guestItems;
          
          if (userCart) {
            const userItems = JSON.parse(userCart);
            const mergedMap = new Map();
            
            // Add user items first
            userItems.forEach((item: CartItem) => {
              mergedMap.set(item.product.product_id, item);
            });
            
            // Merge guest items (combine quantities for existing products)
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
          localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
          localStorage.removeItem(guestCartKey);
          
          toast.success('Cart items transferred successfully!', {
            description: `${guestItems.length} items moved to your account`
          });
        }
      } catch (error) {
        console.error('Error transferring guest cart:', error);
      }
    }
  };

  // Trigger cart transfer when user logs in
  useEffect(() => {
    if (user) {
      transferGuestCart();
    }
  }, [user]);

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);

  const addToCart = (product: Product, quantity: number = 1) => {
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
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.product_id !== productId));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
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
  };

  const clearCart = () => {
    setCartItems([]);
    const cartKey = getCartKey(user?.id);
    localStorage.removeItem(cartKey);
    toast.success('Cart cleared');
  };

  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const assignItemToRecipient = (productId: string, recipientAssignment: RecipientAssignment) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId
          ? { ...item, recipientAssignment }
          : item
      )
    );
    toast.success('Item assigned to recipient', {
      description: `Assigned to ${recipientAssignment.connectionName}`
    });
  };

  const unassignItemFromRecipient = (productId: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId
          ? { ...item, recipientAssignment: undefined }
          : item
      )
    );
    toast.success('Item unassigned from recipient');
  };

  const updateRecipientAssignment = (productId: string, updates: Partial<RecipientAssignment>) => {
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

  const deliveryGroups: DeliveryGroup[] = Array.from(getItemsByRecipient().entries()).map(
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

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
