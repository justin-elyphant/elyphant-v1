/*
 * ========================================================================
 * 🚨 UNIFIED PAYMENT SERVICE - CORE PAYMENT ORCHESTRATOR 🚨
 * ========================================================================
 * 
 * This service consolidates all payment-related functionality while
 * respecting existing unified systems and protection measures.
 * 
 * ⚠️  CRITICAL ARCHITECTURE BOUNDARIES:
 * - MUST call UnifiedMarketplaceService for product operations
 * - MUST route Amazon orders through process-zinc-order Edge Function
 * - MUST separate customer Stripe payments from business Amazon payments
 * - MUST preserve dual payment architecture (Customer → Business)
 * 
 * 🔗 SYSTEM INTEGRATION:
 * - UnifiedMarketplaceService: Product search, details, normalization
 * - Enhanced Zinc API System: Amazon order processing via Edge Functions
 * - Stripe API: Customer payment processing
 * - CartContext: Thin wrapper around this service
 * - UnifiedCheckoutForm: Uses this service for orchestration
 * 
 * 🚫 NEVER:
 * - Bypass UnifiedMarketplaceService for product operations
 * - Make direct Zinc API calls (use Edge Functions only)
 * - Modify Zinc payment method structure
 * - Mix customer and business payment methods
 * 
 * Last major update: 2025-01-23 (Week 1 Implementation)
 * ========================================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { createOrder, CreateOrderData, Order, getOrderById, getUserOrders, updateOrderStatus } from "@/services/orderService";
import { Product } from "@/types/product";
import { CartItem } from "@/contexts/CartContext";
import { RecipientAssignment, DeliveryGroup } from "@/types/recipient";
import { ShippingInfo, GiftOptions } from "@/components/marketplace/checkout/useCheckoutState";
import { toast } from "sonner";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  orderId?: string;
  error?: string;
}

export interface StripePaymentIntent {
  client_secret: string;
  payment_intent_id: string;
}

export interface PaymentProcessingOptions {
  saveAddress?: boolean;
  addressName?: string;
  isGift?: boolean;
  giftMessage?: string;
  scheduledDeliveryDate?: string;
}

// ============================================================================
// UNIFIED PAYMENT SERVICE CLASS
// ============================================================================

class UnifiedPaymentService {
  private cartItems: CartItem[] = [];
  private isProcessing = false;
  private currentUser: any = null;
  private cartKey = 'guest_cart';
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize cart on service creation
    this.initializeCart();
  }

  /*
   * ========================================================================
   * INITIALIZATION & PERSISTENCE
   * ========================================================================
   */

  /**
   * Initialize cart with localStorage data and auth integration
   */
  private async initializeCart(): Promise<void> {
    try {
      // Get current auth state
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUser = user;
      this.updateCartKey();

      // Load cart from localStorage
      this.loadCartFromStorage();

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        const previousUser = this.currentUser;
        this.currentUser = session?.user || null;

        if (event === 'SIGNED_IN' && previousUser === null) {
          // User just logged in - transfer guest cart
          this.transferGuestCart();
        } else if (event === 'SIGNED_OUT') {
          // User logged out - switch to guest cart
          this.updateCartKey();
          this.loadCartFromStorage();
        } else if (this.currentUser?.id !== previousUser?.id) {
          // User changed - update cart key and load
          this.updateCartKey();
          this.loadCartFromStorage();
        }
      });
    } catch (error) {
      console.error('Error initializing cart:', error);
    }
  }

  /**
   * Update cart key based on current user
   */
  private updateCartKey(): void {
    this.cartKey = this.currentUser?.id ? `cart_${this.currentUser.id}` : 'guest_cart';
  }

  /**
   * Load cart items from localStorage
   */
  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.cartKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        this.cartItems = parsedCart || [];
        this.notifyCartChange();
      } else {
        this.cartItems = [];
        this.notifyCartChange();
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.cartItems = [];
      this.notifyCartChange();
    }
  }

  /**
   * Save cart to localStorage (debounced)
   */
  private saveCartToStorage(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      try {
        localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    }, 500);
  }

  /**
   * Transfer guest cart to authenticated user
   */
  private transferGuestCart(): void {
    if (!this.currentUser) return;

    const guestCartKey = 'guest_cart';
    const guestCart = localStorage.getItem(guestCartKey);

    if (guestCart) {
      try {
        const guestItems = JSON.parse(guestCart) || [];
        if (guestItems.length > 0) {
          const userCartKey = `cart_${this.currentUser.id}`;
          const userCart = localStorage.getItem(userCartKey);
          let mergedCart = guestItems;

          if (userCart) {
            const userItems = JSON.parse(userCart) || [];
            const mergedMap = new Map();

            // Add user items first
            userItems.forEach((item: CartItem) => {
              mergedMap.set(item.product.product_id, item);
            });

            // Merge guest items (combine quantities if same product)
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

          this.cartItems = mergedCart;
          this.updateCartKey();
          this.saveCartToStorage();
          localStorage.removeItem(guestCartKey);

          toast.success('Cart items transferred successfully!');
          this.notifyCartChange();
        }
      } catch (error) {
        console.error('Error transferring guest cart:', error);
      }
    }
  }

  /*
   * ========================================================================
   * CART MANAGEMENT (Replaces CartContext Logic)
   * ========================================================================
   */

  /**
   * Add product to cart - MUST call UnifiedMarketplaceService for validation
   */
  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    try {
      // CRITICAL: Use UnifiedMarketplaceService for product details
      const product = await unifiedMarketplaceService.getProductDetails(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const existingItemIndex = this.cartItems.findIndex(
        item => item.product.product_id === productId
      );

      if (existingItemIndex >= 0) {
        this.cartItems[existingItemIndex].quantity += quantity;
      } else {
        this.cartItems.push({
          product,
          quantity,
          recipientAssignment: undefined
        });
      }

      toast.success('Added to cart', {
        description: product.name || product.title
      });

      this.notifyCartChange();
      this.saveCartToStorage();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      throw error;
    }
  }

  /**
   * Update item quantity in cart
   */
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cartItems = this.cartItems.map(item =>
      item.product.product_id === productId
        ? { ...item, quantity }
        : item
    );

    this.notifyCartChange();
    this.saveCartToStorage();
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(
      item => item.product.product_id !== productId
    );
    
    toast.success('Removed from cart');
    this.notifyCartChange();
    this.saveCartToStorage();
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.cartItems = [];
    localStorage.removeItem(this.cartKey);
    toast.success('Cart cleared');
    this.notifyCartChange();
  }

  /**
   * Assign item to recipient (for gifting)
   */
  assignItemToRecipient(productId: string, recipientAssignment?: RecipientAssignment): void {
    this.cartItems = this.cartItems.map(item =>
      item.product.product_id === productId
        ? { ...item, recipientAssignment }
        : item
    );

    if (recipientAssignment) {
      toast.success('Item assigned to recipient');
    } else {
      toast.success('Item unassigned from recipient');
    }
    this.notifyCartChange();
    this.saveCartToStorage();
  }

  /**
   * Get cart total amount
   */
  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }

  /**
   * Get current cart items
   */
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  /**
   * Get total item count
   */
  getItemCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  /*
   * ========================================================================
   * PAYMENT PROCESSING (Customer Stripe Payments)
   * ========================================================================
   */

  /**
   * Create Stripe payment intent for customer payment
   * CRITICAL: This handles CUSTOMER payment only, not business fulfillment
   */
  async createPaymentIntent(amount: number, metadata: any = {}): Promise<StripePaymentIntent> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // CRITICAL: Use Supabase Edge Function, NOT direct Stripe API
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            user_id: user.id,
            order_type: 'marketplace_purchase',
            item_count: this.cartItems.length,
            ...metadata
          }
        }
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        throw new Error('Failed to initialize payment');
      }

      return {
        client_secret: data.client_secret,
        payment_intent_id: data.payment_intent_id
      };
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Process successful customer payment and create order
   */
  async processPaymentSuccess(
    paymentIntentId: string,
    shippingInfo: ShippingInfo,
    billingInfo?: any,
    options: PaymentProcessingOptions = {}
  ): Promise<Order> {
    try {
      this.isProcessing = true;

      // Calculate order totals
      const subtotal = this.getCartTotal();
      const shippingCost = this.calculateShippingCost(shippingInfo);
      const taxAmount = this.calculateTax(subtotal);
      const totalAmount = subtotal + shippingCost + taxAmount;

      // Prepare order data
      const orderData: CreateOrderData = {
        cartItems: this.cartItems,
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        shippingInfo,
        giftOptions: {
          isGift: options.isGift || false,
          recipientName: '',
          giftMessage: options.giftMessage || '',
          giftWrapping: false,
          isSurpriseGift: false,
          scheduledDeliveryDate: options.scheduledDeliveryDate
        },
        paymentIntentId,
        billingInfo,
        deliveryGroups: this.generateDeliveryGroups()
      };

      // CRITICAL: Create order using existing service
      const order = await createOrder(orderData);

      // Check if this order needs Zinc processing (Amazon products)
      const hasAmazonProducts = this.cartItems.some(item => 
        this.isAmazonProduct(item.product)
      );

      if (hasAmazonProducts) {
        // CRITICAL: Route to Enhanced Zinc API System via Edge Function
        await this.processZincOrder(order.id);
      }

      // Clear cart after successful order
      this.clearCart();

      return order;
    } catch (error) {
      console.error('Error processing payment success:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /*
   * ========================================================================
   * ORDER MANAGEMENT & ZINC INTEGRATION
   * ========================================================================
   */

  /**
   * Route Amazon orders to Enhanced Zinc API System
   * CRITICAL: MUST use process-zinc-order Edge Function, never direct API
   */
  private async processZincOrder(orderId: string): Promise<void> {
    try {
      console.log(`Routing order ${orderId} to Enhanced Zinc API System`);

      // CRITICAL: Use existing Edge Function, respect protection measures
      const { data, error } = await supabase.functions.invoke('process-zinc-order', {
        body: {
          orderId,
          isTestMode: false,
          debugMode: false
        }
      });

      if (error) {
        console.error('Error processing Zinc order:', error);
        // Don't throw - order is created, Zinc processing can be retried
        toast.error('Order created but fulfillment processing failed');
        return;
      }

      console.log('Zinc order processing initiated:', data);
      toast.success('Order submitted for fulfillment');
    } catch (error) {
      console.error('Error in processZincOrder:', error);
      // Log error but don't fail the order
    }
  }

  /**
   * Check if product is from Amazon (requires Zinc processing)
   */
  private isAmazonProduct(product: Product): boolean {
    // This logic should match the Enhanced Zinc API System product detection
    return product.vendor === 'amazon' || 
           product.retailer === 'amazon' ||
           (product as any).source === 'amazon';
  }

  /*
   * ========================================================================
   * UTILITY METHODS
   * ========================================================================
   */

  /**
   * Calculate shipping cost based on address and items
   */
  private calculateShippingCost(shippingInfo: ShippingInfo): number {
    // Basic shipping calculation - can be enhanced
    const baseShipping = 5.99;
    const itemCount = this.getItemCount();
    
    if (itemCount > 5) {
      return baseShipping + (itemCount - 5) * 1.50;
    }
    
    return baseShipping;
  }

  /**
   * Calculate tax amount
   */
  private calculateTax(subtotal: number): number {
    const taxRate = 0.0875; // 8.75% tax rate
    return subtotal * taxRate;
  }

  /**
   * Generate delivery groups from recipient assignments
   */
  private generateDeliveryGroups(): DeliveryGroup[] {
    const groupedItems = new Map<string, CartItem[]>();
    
    this.cartItems.forEach(item => {
      if (item.recipientAssignment) {
        const key = item.recipientAssignment.connectionId;
        if (!groupedItems.has(key)) {
          groupedItems.set(key, []);
        }
        groupedItems.get(key)!.push(item);
      }
    });

    return Array.from(groupedItems.entries()).map(([connectionId, items]) => {
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
    });
  }

  /**
   * Notify components of cart changes (for UI updates)
   */
  private notifyCartChange(): void {
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('unifiedPaymentCartChange', {
      detail: {
        cartItems: this.cartItems,
        total: this.getCartTotal(),
        itemCount: this.getItemCount()
      }
    }));
  }

  /*
   * ========================================================================
   * PUBLIC STATE GETTERS
   * ========================================================================
   */

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Re-export order management functions from orderService
  getOrderById = getOrderById;
  getUserOrders = getUserOrders;
  updateOrderStatus = updateOrderStatus;
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const unifiedPaymentService = new UnifiedPaymentService();
export default unifiedPaymentService;