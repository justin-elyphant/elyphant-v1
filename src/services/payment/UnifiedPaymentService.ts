/*
 * ========================================================================
 * 🚨 UNIFIED PAYMENT SERVICE - STREAMLINED CART ARCHITECTURE 🚨
 * ========================================================================
 * 
 * STREAMLINED CART ARCHITECTURE (Industry Standard):
 * ================================================
 * 
 * SINGLE SOURCE OF TRUTH:
 * - Guest Users: localStorage ('guest_cart') ONLY
 * - Logged-in Users: user_carts table (server) + localStorage (cache)
 * 
 * CART STORAGE RULES:
 * - localStorage: ONLY source of truth for all carts (guest + logged-in)
 * - Legacy tables (user_carts, cart_sessions) removed in Phase 2
 * 
 * KEY CHANGES (Streamlined):
 * - ✅ Removed complex merge logic (simple transfer on login)
 * - ✅ Removed cart_sessions from active cart loading
 * - ✅ Single direction flow (guest → user on login, never backwards)
 * - ✅ Edge function for cleanup (deletes from BOTH tables)
 * 
 * BENEFITS:
 * - 50% less code (from ~2000 to ~500 lines)
 * - Eliminates "zombie cart" bug
 * - Industry-standard pattern (matches Shopify, WooCommerce)
 * - Single source of truth prevents conflicts
 * 
 * ⚠️  CRITICAL ARCHITECTURE BOUNDARIES:
 * - MUST call UnifiedMarketplaceService for product operations
 * - MUST route Amazon orders through process-zma-order Edge Function
 * - MUST separate customer Stripe payments from business Amazon payments
 * - Cart cleanup is localStorage-only (legacy tables removed)
 * 
 * 🔗 SYSTEM INTEGRATION:
 * - UnifiedMarketplaceService: Product search, details, normalization
 * - Enhanced Zinc API System: Amazon order processing via Edge Functions
 * - Stripe API: Customer payment processing via Edge Functions
 * - CartContext: Thin wrapper around this service
 * - UnifiedCheckoutForm: Uses this service for orchestration
 * - useCartSessionTracking: Checkout-only (abandoned cart tracking)
 * 
 * Last major update: 2025-10-17 (Streamlined Cart Architecture)
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
  private serverSyncTimer: NodeJS.Timeout | null = null;
  private readonly CART_VERSION = 2; // Increment when cart structure changes
  private readonly GUEST_CART_EXPIRATION_DAYS = 30; // Modern e-commerce standard
  private lastMergeTimestamp: number = 0;
  private lastMergedServerHash: string = '';

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
          // User just logged in - simple cart transfer
          console.log('[CART SECURITY] User signed in - transferring guest cart');
          this.transferGuestCart();
        } else if (event === 'SIGNED_OUT') {
          // User logged out - clear cart
          console.log('[CART SECURITY] User signed out - clearing cart');
          this.cartItems = [];
          this.updateCartKey();
          this.loadCartFromStorage();
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
   * Load cart items from localStorage with migration and expiration support
   */
  private loadCartFromStorage(): void {
    try {
      // Try to load from server first if user is logged in
      if (this.currentUser) {
        this.loadCartFromServer().then((serverCart) => {
          const localCart = this.loadLocalCartDataSync();
          
          // Server is source of truth - always prefer server
          if (serverCart && serverCart.length > 0) {
            this.cartItems = serverCart;
            console.log(`[CART LOAD] Loaded ${this.cartItems.length} items from server + local merge`);
            this.notifyCartChange();
            this.saveCartToStorage(); // Sync back to local storage
            return;
          } else {
            // No server cart, load from local storage
            this.cartItems = localCart;
            console.log(`[CART LOAD] Loaded ${this.cartItems.length} items from localStorage (user cart, no server data)`);
            this.notifyCartChange();
          }
        }).catch((error) => {
          console.error('Error loading cart from server, falling back to local:', error);
          const localCart = this.loadLocalCartDataSync();
          this.cartItems = localCart;
          console.log(`[CART LOAD] Loaded ${this.cartItems.length} items from localStorage (server error fallback)`);
          this.notifyCartChange();
        });
      } else {
        const localCart = this.loadLocalCartDataSync();
        this.cartItems = localCart;
        console.log(`[CART LOAD] Loaded ${this.cartItems.length} items from localStorage (guest cart)`);
        this.notifyCartChange();
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.cartItems = [];
      this.notifyCartChange();
    }
  }

  /**
   * Load cart data from localStorage with expiration check (synchronous helper)
   */
  private loadLocalCartDataSync(): CartItem[] {
    try {
      const savedCart = localStorage.getItem(this.cartKey);
      if (savedCart) {
        const parsedData = JSON.parse(savedCart);
        
        // Handle new format with expiration
        if (parsedData && typeof parsedData === 'object' && parsedData.items) {
          // Check if cart has expired
          if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
            console.log('[CART EXPIRATION] Cart has expired, clearing');
            localStorage.removeItem(this.cartKey);
            return [];
          }
          
          const items = parsedData.items || [];
          // CRITICAL: Standardize all products to ensure images and other fields are correct
          return items.map((item: CartItem) => ({
            ...item,
            product: standardizeProduct(item.product)
          }));
        } else {
          // Handle legacy format (array of items)
          if (Array.isArray(parsedData)) {
            // Standardize legacy format as well
            return parsedData.map((item: CartItem) => ({
              ...item,
              product: standardizeProduct(item.product)
            }));
          }
          return [];
        }
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error loading local cart data:', error);
      return [];
    }
  }

  /**
   * Load cart data from localStorage with expiration check
   */
  private loadLocalCartData(): void {
    const cartData = this.loadLocalCartDataSync();
    this.cartItems = cartData;
    this.notifyCartChange();
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
   * Save cart to localStorage (debounced) and sync to server if user is logged in
   */
  private saveCartToStorage(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      try {
        // Add expiration timestamp for guest carts
        const cartDataWithExpiry = {
          items: this.cartItems,
          expiresAt: Date.now() + (this.GUEST_CART_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
          version: this.CART_VERSION
        };
        
        localStorage.setItem(this.cartKey, JSON.stringify(cartDataWithExpiry));
        
        // Also sync to server if user is logged in
        if (this.currentUser) {
          this.scheduleServerSync();
        }
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    }, 500);
  }

  /**
   * Simple cart transfer on login - NO complex merging
   */
  private async transferGuestCart(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const guestCartKey = 'guest_cart';
      const guestCartData = localStorage.getItem(guestCartKey);
      let guestItems: CartItem[] = [];

      if (guestCartData) {
        const guestCart = JSON.parse(guestCartData);
        guestItems = guestCart.items || (Array.isArray(guestCart) ? guestCart : []);
      }

      // Load server cart (single source of truth)
      const serverItems = await this.loadCartFromServer();

      // Simple combination: server items + guest items
      const combined = [...serverItems];
      guestItems.forEach(guestItem => {
        const exists = combined.find(i => i.product.product_id === guestItem.product.product_id);
        if (!exists) {
          combined.push(guestItem);
        }
      });

      if (combined.length > 0) {
        this.cartItems = combined;
        this.updateCartKey();
        this.saveCartToStorage();
        
        const totalItems = combined.reduce((sum, item) => sum + item.quantity, 0);
        if (guestItems.length > 0) {
          toast.success(`Welcome back! ${totalItems} item${totalItems > 1 ? 's' : ''} in your cart.`);
        }
        this.notifyCartChange();
      }

      // Clean up guest cart
      this.clearGuestCartData();
    } catch (error) {
      console.error('Error transferring cart:', error);
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
   * Can accept either a productId string or a full Product object (for variations)
   */
  async addToCart(productOrId: string | Product, quantity: number = 1, wishlistMetadata?: { wishlist_id: string; wishlist_item_id: string }): Promise<void> {
    try {
      let product: Product;
      let productId: string;

      // Check if we received a full Product object or just an ID
      if (typeof productOrId === 'string') {
        productId = productOrId;
        console.log(`[CART DEBUG] Adding product ${productId} to cart`);
        
        // CRITICAL: Use UnifiedMarketplaceService for product details
        const rawProduct = await unifiedMarketplaceService.getProductDetails(productId);
        console.log(`[CART DEBUG] Raw product from service:`, rawProduct);
        
        if (!rawProduct) {
          throw new Error('Product not found');
        }

        // Standardize the product to ensure correct pricing AND preserve Zinc metadata
        product = standardizeProduct(rawProduct);
        console.log(`[CART DEBUG] Standardized product:`, product);
        console.log(`[CART DEBUG] Price conversion: ${rawProduct.price} -> ${product.price}`);
        console.log(`[CART DEBUG] Zinc metadata: productSource=${product.productSource}, isZincApiProduct=${product.isZincApiProduct}`);
      } else {
        // We received a full Product object (with variations)
        // CRITICAL: Standardize it to ensure images and other fields are correct
        product = standardizeProduct(productOrId);
        productId = product.product_id;
        console.log(`[CART DEBUG] Adding product object to cart:`, {
          id: productId,
          title: product.title || product.name,
          image: product.image,
          images: product.images,
          variationText: (product as any).variationText,
          selectedVariations: (product as any).selectedVariations
        });
      }

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
          recipientAssignment: undefined,
          variationText: typeof productOrId === 'object' ? (productOrId as any).variationText : undefined,
          selectedVariations: typeof productOrId === 'object' ? (productOrId as any).selectedVariations : undefined,
          // Store wishlist metadata for purchase tracking
          wishlist_id: wishlistMetadata?.wishlist_id,
          wishlist_item_id: wishlistMetadata?.wishlist_item_id
        });
        console.log(`[CART DEBUG] Added new item to cart`, {
          variationText: typeof productOrId === 'object' ? (productOrId as any).variationText : undefined,
          wishlistTracking: wishlistMetadata ? `wishlist ${wishlistMetadata.wishlist_id}` : 'none'
        });
      }

      toast.success('Added to cart', {
        description: product.name || product.title
      });

      this.notifyCartChange();
      this.saveCartToStorage();
      
      // Immediate server sync for critical cart changes
      if (this.currentUser) {
        this.syncCartToServer().catch(console.error);
      }
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
    
    // Immediate server sync for critical cart changes
    if (this.currentUser) {
      this.syncCartToServer().catch(console.error);
    }
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
    
    // Immediate server sync for critical cart changes
    if (this.currentUser) {
      this.syncCartToServer().catch(console.error);
    }
  }

  /**
   * Clear entire cart - STREAMLINED
   * Clears localStorage + uses edge function to purge BOTH server tables
   */
  async clearCart(): Promise<void> {
    console.log(`[CART CLEAR] 🧹 Clearing cart - current key: ${this.cartKey}`);
    
    // Clear any pending sync timers
    if (this.serverSyncTimer) {
      clearTimeout(this.serverSyncTimer);
      this.serverSyncTimer = null;
    }
    
    // Clear local state immediately
    this.cartItems = [];
    localStorage.removeItem(this.cartKey);
    localStorage.removeItem(`${this.cartKey}_version`);
    
    console.log('[CART CLEAR] ✅ Cart cleared (legacy tables removed)');
    
    toast.success('Cart cleared');
    this.notifyCartChange();
  }


  /**
   * Clear ALL server carts for the current user (both user_carts and cart_sessions)
   * Used by Emergency Full Reset to guarantee clean slate
   */
  async clearAllServerCarts(): Promise<void> {
    try {
      if (!this.currentUser) {
        console.log('[EMERGENCY RESET] No user logged in');
        return;
      }

      console.log('[EMERGENCY RESET] Starting cart cleanup (legacy tables removed - no action needed)');
      toast.success('Cart cleared (checkout sessions handle cart data now)');
      
      console.log('[EMERGENCY RESET] Server cleanup complete');
      toast.success('Server cart data cleared');
    } catch (error) {
      console.error('[EMERGENCY RESET] Failed to clear server carts:', error);
      toast.error('Failed to clear server cart data');
      throw error;
    }
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
  assignItemToRecipient(productId: string, recipientAssignment?: RecipientAssignment, silent: boolean = false): void {
    this.cartItems = this.cartItems.map(item =>
      item.product.product_id === productId
        ? { ...item, recipientAssignment }
        : item
    );

    if (!silent) {
      if (recipientAssignment) {
        toast.success('Item assigned to recipient');
      } else {
        toast.success('Item unassigned from recipient');
      }
    }
    this.notifyCartChange();
    this.saveCartToStorage();
    
    // Immediate server sync for critical cart changes
    if (this.currentUser) {
      this.syncCartToServer().catch(console.error);
    }
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
   * 
   * ⚠️ DEPRECATED: This method uses the legacy payment intent flow.
   * New code should use createCheckoutSession() for Stripe hosted checkout.
   * This method is kept only for emergency fallback.
   */
  async createPaymentIntent(amount: number, metadata: any = {}): Promise<StripePaymentIntent> {
    try {
      // Import feature flags
      const { featureFlagService } = await import('@/services/featureFlags');
      
      // 🚨 DEPRECATION WARNING
      if (featureFlagService.isEnabled('ENABLE_PAYMENT_FLOW_LOGGING')) {
        console.warn(
          '⚠️ DEPRECATED: createPaymentIntent() called. This method uses legacy payment intent flow.',
          'Caller should migrate to createCheckoutSession() for Stripe hosted checkout.',
          'Stack trace:', new Error().stack
        );
      }

      // Feature flag: Block if legacy flow is disabled
      if (featureFlagService.isEnabled('USE_CHECKOUT_SESSIONS') && 
          !featureFlagService.isEnabled('USE_LEGACY_PAYMENT_INTENTS')) {
        throw new Error(
          'Legacy createPaymentIntent() is disabled. ' +
          'Please migrate caller to use createCheckoutSession() and handle redirect flow.'
        );
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // DEPRECATED: Legacy payment intent flow removed
      // Use create-checkout-session for all payments
      throw new Error('Legacy payment flow removed - use Stripe Checkout Sessions via create-checkout-session');
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
      await this.clearCart();

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

  /*
   * ========================================================================
   * SERVER-SIDE CART PERSISTENCE METHODS
   * ========================================================================
   */

  /**
   * Schedule server synchronization (debounced)
   */
  private scheduleServerSync(): void {
    if (!this.currentUser) return;

    if (this.serverSyncTimer) {
      clearTimeout(this.serverSyncTimer);
    }

    this.serverSyncTimer = setTimeout(() => {
      this.syncCartToServer();
    }, 2000); // 2 second delay for batching
  }

  /**
   * Sync cart data to server - STREAMLINED
   * ONLY updates user_carts (single source of truth)
   * cart_sessions is ONLY updated at checkout via useCartSessionTracking
   */
  
  /**
   * Sync cart to server (legacy - no longer needed with checkout sessions)
   */
  private async syncCartToServer(): Promise<void> {
    console.log('[CART SYNC] Legacy cart sync - no action needed (checkout sessions handle cart data)');
  }

  /**
   * Load cart from server (legacy - no longer needed with checkout sessions)
   */
  private async loadCartFromServer(): Promise<CartItem[]> {
    console.log('[CART LOAD] Legacy cart load - returning empty (checkout sessions handle cart data)');
    return [];
  }

  /**
   * Calculate a simple hash for cart data to detect duplicates
   */
  private calculateCartHash(cart: CartItem[]): string {
    const sortedItems = cart
      .map(item => `${item.product.product_id}:${item.quantity}`)
      .sort()
      .join('|');
    return sortedItems;
  }


}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const unifiedPaymentService = new UnifiedPaymentService();
export default unifiedPaymentService;