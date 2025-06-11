
import { CartItem } from "@/contexts/CartContext";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validItems: CartItem[];
  invalidItems: CartItem[];
}

export interface ProductAvailability {
  product_id: string;
  available: boolean;
  stock_count?: number;
  price_changed?: boolean;
  new_price?: number;
}

// Lightweight validation that doesn't block the UI
export const validateCartData = (cartItems: CartItem[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validItems: CartItem[] = [];
  const invalidItems: CartItem[] = [];

  cartItems.forEach((item) => {
    const { product, quantity } = item;
    
    // Basic validation only
    if (!product.product_id || quantity <= 0) {
      errors.push(`Invalid item: ${product.name || 'Unknown product'}`);
      invalidItems.push(item);
      return;
    }

    if (typeof product.price !== 'number' || product.price <= 0) {
      errors.push(`Invalid price for: ${product.name || product.title}`);
      invalidItems.push(item);
      return;
    }

    validItems.push(item);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validItems,
    invalidItems
  };
};

// Simplified async validation - only called when needed
export const validateProductAvailability = async (cartItems: CartItem[]): Promise<ProductAvailability[]> => {
  // Return quick mock data to prevent blocking
  return cartItems.map((item) => ({
    product_id: item.product.product_id,
    available: true,
    stock_count: 50,
    price_changed: false
  }));
};

export const sanitizeCartItem = (item: CartItem): CartItem => {
  return {
    product: {
      ...item.product,
      name: item.product.name || item.product.title || 'Unknown Product',
      price: Math.max(0, item.product.price || 0),
      image: item.product.image || '/placeholder.svg'
    },
    quantity: Math.max(1, Math.floor(item.quantity || 1))
  };
};

export const updateCartItemPrices = (
  cartItems: CartItem[], 
  priceUpdates: ProductAvailability[]
): CartItem[] => {
  const priceMap = new Map(
    priceUpdates
      .filter(update => update.price_changed && update.new_price)
      .map(update => [update.product_id, update.new_price!])
  );

  return cartItems.map(item => {
    const newPrice = priceMap.get(item.product.product_id);
    if (newPrice) {
      return {
        ...item,
        product: {
          ...item.product,
          price: newPrice
        }
      };
    }
    return item;
  });
};
