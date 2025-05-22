
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function getProductId(product: Product) {
  return product.product_id || product.id || "";
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (e) {
        console.error("Error parsing cart from localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    setCartTotal(total);
    setItemCount(count);
  }, [cartItems]);

  const addToCart = (product: Product, quantity = 1) => {
    // Always normalize product.id and product.product_id so both are available
    const normalizedProduct: Product = {
      ...product,
      id: product.id || product.product_id,
      product_id: product.product_id || product.id,
      name: product.name || product.title,
      title: product.title || product.name,
    };

    setCartItems(prevItems => {
      const newId = getProductId(normalizedProduct);
      const existingItem = prevItems.find(item => getProductId(item.product) === newId);

      if (existingItem) {
        toast.success(`Updated ${normalizedProduct.name || normalizedProduct.title} quantity in your cart`);
        return prevItems.map(item => 
          getProductId(item.product) === newId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        toast.success(`Added ${normalizedProduct.name || normalizedProduct.title} to your cart`);
        return [
          ...prevItems,
          {
            product: normalizedProduct,
            quantity
          }
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => getProductId(item.product) === productId);
      if (itemToRemove) {
        toast.info(`Removed ${itemToRemove.product.name || itemToRemove.product.title} from your cart`, {
          action: {
            label: "Continue Shopping",
            onClick: () => window.location.href = "/marketplace"
          }
        });
      }
      return prevItems.filter(item => getProductId(item.product) !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        getProductId(item.product) === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.info("Cart has been cleared");
  };

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        cartTotal,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
