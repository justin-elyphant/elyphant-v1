
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export interface CartItem {
  product: Product;
  quantity: number;
  assignedConnectionId?: string | null;
}

export interface CartGroup {
  connectionId: string | null;
  connectionName: string;
  items: CartItem[];
  giftMessage?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  cartGroups: CartGroup[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  assignToConnection: (productId: string, connectionId: string | null) => void;
  updateGiftMessage: (connectionId: string | null, message: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  transferGuestCart: () => void;
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
  const [giftMessages, setGiftMessages] = useState<Record<string, string>>({});

  const cartKey = useMemo(() => getCartKey(user?.id), [user?.id]);

  // Debounced localStorage save
  useDebounceLocalStorage(cartKey, { cartItems, giftMessages });

  // Load cart from localStorage on mount and user change
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart.cartItems || parsedCart);
        setGiftMessages(parsedCart.giftMessages || {});
      } catch (error) {
        console.error('Error parsing cart data:', error);
        localStorage.removeItem(cartKey);
        setCartItems([]);
        setGiftMessages({});
      }
    } else {
      setCartItems([]);
      setGiftMessages({});
    }
  }, [cartKey]);

  // Memoized calculations to prevent unnecessary recalculations
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [cartItems]);

  const cartGroups = useMemo((): CartGroup[] => {
    const groups = new Map<string, CartGroup>();
    
    cartItems.forEach(item => {
      const key = item.assignedConnectionId || 'self';
      const connectionName = item.assignedConnectionId ? 'Connection' : 'Myself';
      
      if (!groups.has(key)) {
        groups.set(key, {
          connectionId: item.assignedConnectionId || null,
          connectionName,
          items: [],
          giftMessage: giftMessages[key] || ''
        });
      }
      
      groups.get(key)!.items.push(item);
    });
    
    return Array.from(groups.values());
  }, [cartItems, giftMessages]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Transfer guest cart to authenticated user
  const transferGuestCart = useCallback(() => {
    if (!user) return;

    const guestCartKey = getCartKey();
    const guestCart = localStorage.getItem(guestCartKey);
    
    if (guestCart) {
      try {
        const guestData = JSON.parse(guestCart);
        const guestItems = guestData.cartItems || guestData;
        
        if (guestItems.length > 0) {
          const userCartKey = getCartKey(user.id);
          const userCart = localStorage.getItem(userCartKey);
          let mergedCart = guestItems;
          
          if (userCart) {
            const userData = JSON.parse(userCart);
            const userItems = userData.cartItems || userData;
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
      
      return [...prev, { product, quantity, assignedConnectionId: null }];
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

  const assignToConnection = useCallback((productId: string, connectionId: string | null) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.product_id === productId
          ? { ...item, assignedConnectionId: connectionId }
          : item
      )
    );
    
    const message = connectionId ? 'Item assigned for gifting' : 'Item set for personal delivery';
    toast.success(message);
  }, []);

  const updateGiftMessage = useCallback((connectionId: string | null, message: string) => {
    const key = connectionId || 'self';
    setGiftMessages(prev => ({
      ...prev,
      [key]: message
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setGiftMessages({});
    localStorage.removeItem(cartKey);
    toast.success('Cart cleared');
  }, [cartKey]);

  const contextValue = useMemo(() => ({
    cartItems,
    cartTotal,
    cartGroups,
    addToCart,
    removeFromCart,
    updateQuantity,
    assignToConnection,
    updateGiftMessage,
    clearCart,
    getItemCount,
    transferGuestCart,
  }), [
    cartItems,
    cartTotal,
    cartGroups,
    addToCart,
    removeFromCart,
    updateQuantity,
    assignToConnection,
    updateGiftMessage,
    clearCart,
    getItemCount,
    transferGuestCart,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
