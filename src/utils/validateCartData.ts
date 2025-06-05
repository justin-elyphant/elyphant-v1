
import { CartItem } from "@/contexts/CartContext";
import { Product } from "@/types/product";

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

export const validateCartData = (cartItems: CartItem[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validItems: CartItem[] = [];
  const invalidItems: CartItem[] = [];

  cartItems.forEach((item) => {
    const { product, quantity } = item;
    
    // Required field validation
    if (!product.product_id) {
      errors.push(`Product missing ID: ${product.name || 'Unknown product'}`);
      invalidItems.push(item);
      return;
    }

    if (!product.name && !product.title) {
      errors.push(`Product missing name: ${product.product_id}`);
      invalidItems.push(item);
      return;
    }

    if (typeof product.price !== 'number' || product.price <= 0) {
      errors.push(`Invalid price for product: ${product.name || product.title}`);
      invalidItems.push(item);
      return;
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      errors.push(`Invalid quantity for product: ${product.name || product.title}`);
      invalidItems.push(item);
      return;
    }

    // Warnings for missing optional fields
    if (!product.image) {
      warnings.push(`Product missing image: ${product.name || product.title}`);
    }

    if (!product.vendor) {
      warnings.push(`Product missing vendor: ${product.name || product.title}`);
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

export const validateProductAvailability = async (cartItems: CartItem[]): Promise<ProductAvailability[]> => {
  // This would typically call an API to check product availability
  // For now, we'll simulate the check with mock logic
  
  return cartItems.map((item) => {
    const { product } = item;
    
    // Mock availability logic - in real implementation, this would call Zinc API
    const isAvailable = Math.random() > 0.1; // 90% availability rate
    const priceChanged = Math.random() > 0.9; // 10% chance of price change
    
    return {
      product_id: product.product_id,
      available: isAvailable,
      stock_count: isAvailable ? Math.floor(Math.random() * 100) + 1 : 0,
      price_changed: priceChanged,
      new_price: priceChanged ? product.price * (0.9 + Math.random() * 0.2) : undefined
    };
  });
};

export const sanitizeCartItem = (item: CartItem): CartItem => {
  return {
    product: {
      ...item.product,
      name: item.product.name || item.product.title || 'Unknown Product',
      title: item.product.title || item.product.name || 'Unknown Product',
      price: Math.max(0, item.product.price || 0),
      image: item.product.image || '/placeholder.svg',
      vendor: item.product.vendor || 'Unknown Vendor'
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
