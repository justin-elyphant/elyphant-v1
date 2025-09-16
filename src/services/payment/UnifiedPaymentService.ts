/*
 * ========================================================================
 * 🚨 UNIFIED PAYMENT SERVICE - COMPLETE PAYMENT CONSOLIDATION 🚨
 * ========================================================================
 * 
 * This service consolidates ALL payment-related functionality including:
 * - Payment method management (save, delete, set default)
 * - Stripe checkout session and payment intent management
 * - Cart management and order processing
 * - Integration with all existing protection measures
 * - Subscription management and billing
 * 
 * ⚠️  CRITICAL ARCHITECTURE BOUNDARIES:
 * - MUST call UnifiedMarketplaceService for product operations
 * - MUST route Amazon orders through process-zma-order Edge Function (zinc_api disabled)
 * - MUST separate customer Stripe payments from business Amazon payments
 * - MUST preserve dual payment architecture (Customer → Business)
 * - MUST integrate with existing Zinc API protection measures
 * 
 * 🔗 SYSTEM INTEGRATION:
 * - UnifiedMarketplaceService: Product search, details, normalization
 * - Enhanced Zinc API System: Amazon order processing via Edge Functions
 * - Stripe API: Customer payment processing via Edge Functions
 * - CartContext: Thin wrapper around this service
 * - UnifiedCheckoutForm: Uses this service for orchestration
 * - Payment Analytics: Monitoring and error tracking
 * - Circuit Breaker: Rate limiting and failure protection
 * 
 * 🚫 NEVER:
 * - Bypass UnifiedMarketplaceService for product operations
 * - Make direct Zinc API calls (use Edge Functions only)
 * - Make direct Stripe API calls (use Edge Functions only)
 * - Modify Zinc payment method structure
 * - Mix customer and business payment methods
 * 
 * COMPLETE CONSOLIDATION STATUS:
 * ✅ Cart Management - Replaces scattered cart logic
 * ✅ Payment Methods - Consolidates payment method operations
 * ✅ Stripe Integration - Centralizes all Stripe operations
 * ✅ Order Processing - Unified order creation and management
 * ✅ Protection Measures - Integrates all existing safeguards
 * 
 * Last major update: 2025-01-24 (Phase 1 - Complete Payment Unification)
 * ========================================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { createOrder, CreateOrderData, Order, getOrderById, getUserOrders, updateOrderStatus } from "@/services/orderService";
import { stripeClientManager } from "./StripeClientManager";
import { paymentAnalyticsService, enhancedPaymentErrorHandler } from "./PaymentAnalytics";
import { Product } from "@/types/product";
import { CartItem } from "@/contexts/CartContext";
import { RecipientAssignment, DeliveryGroup } from "@/types/recipient";
import { ShippingInfo } from "@/components/marketplace/checkout/useCheckoutState";
import { GiftOptions } from "@/types/gift-options";
import { toast } from "sonner";
import { standardizeProduct } from "@/components/marketplace/product-item/productUtils";

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

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

export interface CheckoutSession {
  url: string;
  session_id: string;
}

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
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
  private readonly CART_VERSION = 2; // Increment when cart structure changes

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
      
      // SECURITY: Clean up any potentially leaked cart data on initialization
      this.performSecurityCleanup();
      
      this.updateCartKey();

      // Load cart from localStorage
      this.loadCartFromStorage();

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        const previousUser = this.currentUser;
        this.currentUser = session?.user || null;

        console.log(`[CART SECURITY] Auth state change: ${event}, Previous user: ${previousUser?.id}, Current user: ${this.currentUser?.id}`);

        if (event === 'SIGNED_IN' && previousUser === null) {
          // User just logged in - transfer guest cart
          console.log('[CART SECURITY] User signed in - transferring guest cart');
          this.transferGuestCart();
        } else if (event === 'SIGNED_OUT') {
          // User logged out - CLEAR CART IMMEDIATELY for security
          console.log('[CART SECURITY] User signed out - clearing cart for security');
          this.forceCartClearForSecurity();
          this.updateCartKey();
          this.loadCartFromStorage(); // Load guest cart if exists
        } else if (this.currentUser?.id !== previousUser?.id && this.currentUser && previousUser) {
          // Different user logged in - CRITICAL SECURITY: Clear old cart data immediately
          console.log(`[CART SECURITY] User switched from ${previousUser?.id} to ${this.currentUser?.id} - clearing previous cart`);
          this.forceCartClearForSecurity();
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
   * Load cart items from localStorage with migration support
   */
  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.cartKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        let cartData = parsedCart || [];
        
        // Check if cart needs migration (no version or old version)
        const versionKey = `${this.cartKey}_version`;
        const savedVersion = localStorage.getItem(versionKey);
        const currentVersion = parseInt(savedVersion || '0');
        
        if (currentVersion < this.CART_VERSION) {
          console.log(`[CART MIGRATION] Migrating cart from version ${currentVersion} to ${this.CART_VERSION}`);
          console.log(`[CART MIGRATION] Original cart data:`, cartData);
          cartData = this.migrateCartData(cartData, currentVersion);
          
          // Save migrated cart and update version
          this.cartItems = cartData;
          this.saveCartToStorage();
          localStorage.setItem(versionKey, this.CART_VERSION.toString());
          
          if (cartData.length > 0) {
            toast.success('Cart updated with improved pricing!');
          }
        } else {
          this.cartItems = cartData;
        }
        
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
   * Migrate cart data to fix pricing and other issues
   */
  private migrateCartData(cartItems: CartItem[], fromVersion: number): CartItem[] {
    try {
      return cartItems.map(item => {
        // Re-standardize the product to fix pricing issues AND preserve Zinc metadata
        const standardizedProduct = standardizeProduct(item.product);
        
        // Log price changes for debugging
        if (item.product.price !== standardizedProduct.price) {
          console.log(`Price migration: ${item.product.title} - ${item.product.price} → ${standardizedProduct.price}`);
        }
        
        // Log Zinc metadata preservation
        console.log(`Zinc metadata migration for ${item.product.title}:`, {
          productSource: standardizedProduct.productSource,
          isZincApiProduct: standardizedProduct.isZincApiProduct,
          retailer: standardizedProduct.retailer,
          vendor: standardizedProduct.vendor
        });
        
        return {
          ...item,
          product: standardizedProduct
        };
      });
    } catch (error) {
      console.error('Error migrating cart data:', error);
      return cartItems; // Return original data if migration fails
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
          this.clearGuestCartData();

          toast.success('Cart items transferred successfully!');
          this.notifyCartChange();
        }
      } catch (error) {
        console.error('Error transferring guest cart:', error);
      }
    }
  }

  /**
   * SECURITY: Perform cleanup of potentially leaked cart data across localStorage
   * This prevents cart data from one user being seen by another user
   */
  private performSecurityCleanup(): void {
    try {
      // Find all localStorage keys that could contain cart data
      const cartKeysToCheck = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cart_') || key === 'guest_cart')) {
          cartKeysToCheck.push(key);
        }
      }

      // If user is logged in, only keep their cart data
      if (this.currentUser) {
        const validUserCartKey = `cart_${this.currentUser.id}`;
        cartKeysToCheck.forEach(key => {
          if (key !== validUserCartKey && key !== `${validUserCartKey}_version`) {
            localStorage.removeItem(key);
            console.log(`[CART SECURITY] Removed stale cart data: ${key}`);
          }
        });
      } else {
        // If no user is logged in, clear all user cart data but keep guest cart
        cartKeysToCheck.forEach(key => {
          if (key.startsWith('cart_') && key !== 'guest_cart') {
            localStorage.removeItem(key);
            console.log(`[CART SECURITY] Removed user cart data while logged out: ${key}`);
          }
        });
      }
    } catch (error) {
      console.error('Error during security cleanup:', error);
    }
  }

  /**
   * SECURITY: Clear all guest cart data from localStorage
   */
  private clearGuestCartData(): void {
    try {
      localStorage.removeItem('guest_cart');
      localStorage.removeItem('guest_cart_version');
      console.log('[CART SECURITY] Cleared guest cart data');
    } catch (error) {
      console.error('Error clearing guest cart data:', error);
    }
  }

  /**
   * SECURITY: Clear cart data for a specific user (prevents data leakage)
   */
  private clearUserCartData(userId: string): void {
    try {
      localStorage.removeItem(`cart_${userId}`);
      localStorage.removeItem(`cart_${userId}_version`);
      console.log(`[CART SECURITY] Cleared cart data for user ${userId}`);
    } catch (error) {
      console.error(`Error clearing cart data for user ${userId}:`, error);
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
      console.log(`[CART DEBUG] Adding product ${productId} to cart`);
      
      // CRITICAL: Use UnifiedMarketplaceService for product details
      const rawProduct = await unifiedMarketplaceService.getProductDetails(productId);
      console.log(`[CART DEBUG] Raw product from service:`, rawProduct);
      
      if (!rawProduct) {
        throw new Error('Product not found');
      }

      // Standardize the product to ensure correct pricing AND preserve Zinc metadata
      const product = standardizeProduct(rawProduct);
      console.log(`[CART DEBUG] Standardized product:`, product);
      console.log(`[CART DEBUG] Price conversion: ${rawProduct.price} -> ${product.price}`);
      console.log(`[CART DEBUG] Zinc metadata: productSource=${product.productSource}, isZincApiProduct=${product.isZincApiProduct}`);

      const existingItemIndex = this.cartItems.findIndex(
        item => item.product.product_id === productId
      );

      if (existingItemIndex >= 0) {
        this.cartItems[existingItemIndex].quantity += quantity;
        console.log(`[CART DEBUG] Updated existing item quantity`);
      } else {
        this.cartItems.push({
          product,
          quantity,
          recipientAssignment: undefined
        });
        console.log(`[CART DEBUG] Added new item to cart`);
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
    console.log(`[CART DEBUG] Clearing cart - current key: ${this.cartKey}`);
    this.cartItems = [];
    localStorage.removeItem(this.cartKey);
    localStorage.removeItem(`${this.cartKey}_version`); // Also clear version
    toast.success('Cart cleared');
    this.notifyCartChange();
  }

  /**
   * SECURITY: Force clear cart for authentication events (no toast notification)
   */
  private forceCartClearForSecurity(): void {
    console.log(`[CART SECURITY] Force clearing cart - current key: ${this.cartKey}`);
    this.cartItems = [];
    
    // Clear current cart from localStorage
    if (this.cartKey) {
      localStorage.removeItem(this.cartKey);
      localStorage.removeItem(`${this.cartKey}_version`);
    }
    
    // Perform broader security cleanup
    this.performSecurityCleanup();
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

      // Calculate order totals including gifting fee
      const subtotal = this.getCartTotal();
      const shippingCost = this.calculateShippingCost(shippingInfo);
      const taxAmount = this.calculateTax(subtotal);
      
      // Calculate gifting fee using pricing settings (temporary fallback for UnifiedPaymentService)
      // TODO: Integrate with usePricingSettings hook properly
      const giftingFee = subtotal * 0.15; // 15% default gifting fee
      const giftingFeeName = 'Elyphant Gifting Fee';
      const giftingFeeDescription = 'Platform service fee for streamlined delivery and customer support';
      
      const totalAmount = subtotal + shippingCost + taxAmount + giftingFee;

      // Prepare order data
      const orderData: CreateOrderData = {
        cartItems: this.cartItems,
        subtotal,
        shippingCost,
        giftingFee,
        giftingFeeName,
        giftingFeeDescription,
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
   * PAYMENT METHOD MANAGEMENT (Complete Consolidation)
   * ========================================================================
   */

  /**
   * Get all saved payment methods for current user
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw new Error('Failed to load payment methods');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPaymentMethods:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'getPaymentMethods');
      throw error;
    }
  }

  /**
   * Save a new payment method via Edge Function
   */
  async savePaymentMethod(paymentMethodId: string, makeDefault: boolean = false): Promise<PaymentMethod> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase.functions.invoke('save-payment-method', {
        body: {
          paymentMethodId,
          makeDefault
        }
      });

      if (error) {
        console.error('Error saving payment method:', error);
        throw new Error('Failed to save payment method');
      }

      // Track payment method analytics
      paymentAnalyticsService.trackPayment({
        paymentIntentId: `method_${paymentMethodId}`,
        amount: 0,
        currency: 'usd',
        status: 'succeeded',
        paymentMethod: data.paymentMethod.card_type,
        userId: user.id,
        metadata: { operation: 'save_payment_method' }
      });

      return data.paymentMethod;
    } catch (error) {
      console.error('Error in savePaymentMethod:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'savePaymentMethod');
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // First, set all methods to not default
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the selected method as default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) {
        console.error('Error setting default payment method:', error);
        throw new Error('Failed to update default payment method');
      }

      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error in setDefaultPaymentMethod:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'setDefaultPaymentMethod');
      throw error;
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) {
        console.error('Error removing payment method:', error);
        throw new Error('Failed to remove payment method');
      }

      toast.success('Payment method removed');
    } catch (error) {
      console.error('Error in removePaymentMethod:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'removePaymentMethod');
      throw error;
    }
  }

  /*
   * ========================================================================
   * CHECKOUT SESSION MANAGEMENT (Stripe Checkout)
   * ========================================================================
   */

  /**
   * Create Stripe checkout session for one-time payments
   */
  async createCheckoutSession(
    cartItems: CartItem[],
    totalAmount: number,
    shippingInfo?: ShippingInfo,
    giftOptions?: GiftOptions,
    metadata: any = {}
  ): Promise<CheckoutSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartItems,
          totalAmount,
          shippingInfo,
          giftOptions,
          metadata: {
            user_id: user?.id || 'guest',
            order_type: 'marketplace_checkout',
            ...metadata
          }
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error('Failed to create checkout session');
      }

      // Track checkout session creation
      paymentAnalyticsService.trackPayment({
        paymentIntentId: `checkout_${data.session_id}`,
        amount: totalAmount,
        currency: 'usd',
        status: 'initiated',
        paymentMethod: 'checkout_session',
        userId: user?.id,
        metadata: { operation: 'create_checkout_session' }
      });

      return {
        url: data.url,
        session_id: data.session_id
      };
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'createCheckoutSession');
      throw error;
    }
  }

  /**
   * Verify checkout session completion
   */
  async verifyCheckoutSession(sessionId: string): Promise<{ success: boolean; order?: Order }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
        body: { sessionId }
      });

      if (error) {
        console.error('Error verifying checkout session:', error);
        throw new Error('Failed to verify checkout session');
      }

      return data;
    } catch (error) {
      console.error('Error in verifyCheckoutSession:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'verifyCheckoutSession');
      throw error;
    }
  }

  /*
   * ========================================================================
   * SUBSCRIPTION MANAGEMENT
   * ========================================================================
   */

  /**
   * Check subscription status
   */
  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        throw new Error('Failed to check subscription status');
      }

      return {
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier,
        subscription_end: data.subscription_end
      };
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
      return { subscribed: false };
    }
  }

  /**
   * Create subscription checkout session
   */
  async createSubscriptionCheckout(priceId: string): Promise<CheckoutSession> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) {
        console.error('Error creating subscription checkout:', error);
        throw new Error('Failed to create subscription checkout');
      }

      return {
        url: data.url,
        session_id: data.session_id || ''
      };
    } catch (error) {
      console.error('Error in createSubscriptionCheckout:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'createSubscriptionCheckout');
      throw error;
    }
  }

  /**
   * Access customer portal for subscription management
   */
  async getCustomerPortalUrl(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error accessing customer portal:', error);
        throw new Error('Failed to access customer portal');
      }

      return data.url;
    } catch (error) {
      console.error('Error in getCustomerPortalUrl:', error);
      enhancedPaymentErrorHandler.handlePaymentError(error as Error, 'getCustomerPortalUrl');
      throw error;
    }
  }

  /*
   * ========================================================================
   * ORDER MANAGEMENT & ZINC INTEGRATION
   * ========================================================================
   */

  /**
   * Route Amazon orders to Enhanced Zinc API System
   * CRITICAL: MUST use process-zma-order Edge Function (zinc_api disabled)
   */
  private async processZincOrder(orderId: string): Promise<void> {
    try {
      console.log(`Routing order ${orderId} to Enhanced Zinc API System`);

      // CRITICAL: Use existing Edge Function, respect protection measures
      const { data, error } = await supabase.functions.invoke('process-zma-order', {
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

  /*
   * ========================================================================
   * ORDER MANAGEMENT CONSOLIDATION (Extended Phase 1)
   * ========================================================================
   */

  /**
   * Get order by ID with analytics tracking
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const order = await getOrderById(orderId);
    if (order) {
      paymentAnalyticsService.trackPayment({
        paymentIntentId: `order_${orderId}`,
        amount: order.total_amount,
        currency: 'usd',
        status: 'succeeded',
        paymentMethod: 'order_view'
      });
    }
    return order;
  }

  /**
   * Get user orders with analytics and caching
   */
  async getUserOrders(): Promise<Order[]> {
    const orders = await getUserOrders();
    paymentAnalyticsService.trackPayment({
      paymentIntentId: 'orders_fetch',
      amount: 0,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: 'system',
      metadata: { order_count: orders.length }
    });
    return orders;
  }

  /**
   * Update order status with analytics
   */
  async updateOrderStatus(orderId: string, status: string, updates: any = {}) {
    await updateOrderStatus(orderId, status, updates);
    paymentAnalyticsService.trackPayment({
      paymentIntentId: `status_${orderId}`,
      amount: 0,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: 'system',
      metadata: { order_id: orderId, new_status: status }
    });
  }

  /**
   * Get order analytics for customer intelligence
   */
  async getOrderAnalytics(userId?: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    recentOrders: Order[];
    orderTrends: any;
  }> {
    const orders = userId ? 
      await this.getOrdersByUserId(userId) : 
      await this.getUserOrders();
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const recentOrders = orders.slice(0, 5);
    
    const orderTrends = this.calculateOrderTrends(orders);
    
    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      recentOrders,
      orderTrends
    };
  }

  /**
   * Get orders by user ID (admin function)
   */
  private async getOrdersByUserId(userId: string): Promise<Order[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    const normalized = (orders || []).map((o: any) => ({
      ...o,
      shipping_info: typeof o.shipping_info === 'string' ? JSON.parse(o.shipping_info as any) : o.shipping_info,
      order_items: o.order_items || []
    })) as unknown as Order[];

    return normalized;
  }

  /**
   * Calculate order trends for analytics
   */
  private calculateOrderTrends(orders: Order[]): any {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    );
    
    const monthlySpend = recentOrders.reduce((sum, order) => 
      sum + Number(order.total_amount), 0
    );
    
    return {
      monthlyOrderCount: recentOrders.length,
      monthlySpend,
      averageMonthlyOrder: recentOrders.length > 0 ? monthlySpend / recentOrders.length : 0,
      growthTrend: this.calculateGrowthTrend(orders)
    };
  }

  /**
   * Calculate growth trend
   */
  private calculateGrowthTrend(orders: Order[]): 'up' | 'down' | 'stable' {
    if (orders.length < 4) return 'stable';
    
    const now = new Date();
    const currentMonth = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    });
    
    const lastMonth = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return orderDate.getMonth() === lastMonthDate.getMonth() && 
             orderDate.getFullYear() === lastMonthDate.getFullYear();
    });

    if (currentMonth.length > lastMonth.length) return 'up';
    if (currentMonth.length < lastMonth.length) return 'down';
    return 'stable';
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const unifiedPaymentService = new UnifiedPaymentService();
export default unifiedPaymentService;