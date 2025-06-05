
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        transferGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
