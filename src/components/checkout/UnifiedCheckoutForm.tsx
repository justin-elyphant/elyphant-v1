
/*
 * ========================================================================
 * 🚨 CRITICAL SYSTEM COMPONENT - DO NOT SIMPLIFY OR REPLACE 🚨
 * ========================================================================
 * 
 * This is the CORE checkout form component that handles sophisticated
 * payment processing, order creation, and Supabase integration.
 * 
 * ⚠️  BEFORE MAKING ANY CHANGES:
 * - This component integrates with Stripe payments via edge functions
 * - It handles complex order creation with multiple recipient support
 * - It manages shipping calculations and tax processing
 * - It coordinates with multiple specialized sub-components
 * 
 * 🔗 CRITICAL DEPENDENCIES (DO NOT BREAK):
 * - useCheckoutState: Manages complex form state and validation
 * - UnifiedShippingForm: Handles shipping address and method selection
 * - RecipientAssignmentSection: Handles gift recipient assignments
 * - Supabase edge functions: create-checkout-session, stripe-webhook-v2
 * 
 * 🚫 NEVER REPLACE WITH:
 * - Simple form components
 * - Basic payment processing
 * - Direct API calls (must use supabase.functions.invoke)
 * - Hardcoded shipping options
 * 
 * 📋 RESTORATION CHECKLIST:
 * If this file is accidentally simplified/broken:
 * 1. Check git history for the sophisticated implementation
 * 2. Ensure all imports are present (useCheckoutState, UnifiedShippingForm, etc.)
 * 3. Verify Supabase edge function integration
 * 4. Test payment processing end-to-end
 * 5. Confirm order creation works with database
 * 
 * Last major update: 2025-01-20
 * ========================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { invokeWithAuthRetry } from '@/utils/supabaseWithAuthRetry';
import { unifiedRecipientService } from '@/services/unifiedRecipientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ShoppingBag, AlertCircle, ArrowLeft, Shield, Gift, Mail } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// CRITICAL: These imports are essential for the checkout system
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import CheckoutShippingReview from './CheckoutShippingReview';
import CheckoutProgressIndicator from './CheckoutProgressIndicator';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { triggerHapticFeedback, HapticPatterns } from '@/utils/haptics';

/*
 * 🎯 CORE CHECKOUT COMPONENT
 * 
 * This component orchestrates the entire checkout process:
 * 1. Shipping information collection and validation
 * 2. Payment method selection and processing
 * 3. Order creation and confirmation
 * 4. Integration with Supabase for data persistence
 * 
 * The component uses a sophisticated state management system that
 * handles complex validation, shipping calculations, and payment processing.
 */
const UnifiedCheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart, deliveryGroups, getItemsByRecipient, updateRecipientAssignment } = useCart();
  const isMobile = useIsMobile();
  
  // CRITICAL: This hook manages all checkout state and validation
  const {
    activeTab,
    checkoutData,
    giftOptions,
    addressesLoaded,
    isProcessing,
    isWishlistPurchase,
    wishlistOwnerInfo,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handleUpdateGiftOptions,
    canPlaceOrder,
    getShippingCost,
    saveCurrentAddressToProfile
  } = useCheckoutState();

  // Pricing settings for dynamic gifting fee calculation
  const { calculatePriceBreakdown } = usePricingSettings();

  // Payment processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(true);
  const [shippingCostLoaded, setShippingCostLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Guest email validation state
  const [guestEmailError, setGuestEmailError] = useState<string | null>(null);
  const [guestEmailTouched, setGuestEmailTouched] = useState(false);

  const validateGuestEmail = (email: string): string | null => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const isGuestEmailValid = user || !validateGuestEmail(checkoutData.shippingInfo.email || '');

  // Calculate totals - CRITICAL: This logic must match order creation
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // 🚨 CRITICAL: Dynamic gifting fee calculation using pricing settings
  // ⚠️  NEVER hardcode giftingFee = 0 - this breaks the business model
  // 🔗 This integrates with Trunkline pricing controls for real-time updates
  const priceBreakdown = calculatePriceBreakdown(subtotal, shippingCost ?? 0);
  const giftingFee = priceBreakdown.giftingFee;
  const giftingFeeName = priceBreakdown.giftingFeeName;
  const giftingFeeDescription = priceBreakdown.giftingFeeDescription;
  
  // 🛡️ DEVELOPMENT SAFEGUARDS - Remove in production
  if (process.env.NODE_ENV === 'development') {
    if (giftingFee === 0 && subtotal > 0) {
      console.warn('🚨 CHECKOUT WARNING: Gifting fee is $0 but should be calculated from pricing settings!');
      console.warn('Check: usePricingSettings hook, calculatePriceBreakdown function, pricing_settings table');
    }
    if (!giftingFeeName || giftingFeeName === 'Gifting Fee') {
      console.warn('⚠️ Using default gifting fee name - check pricing_settings.fee_display_name');
    }
  }
  
  const taxRate = 0.0875; // 8.75% tax rate
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + (shippingCost ?? 0) + giftingFee + taxAmount;

  // 🔍 Address completeness validation helper
  const isCompleteAddress = (addr: any): boolean => {
    if (!addr) return false;
    
    // Check both legacy and DB key formats
    const line1 = addr.address_line1 || addr.address || addr.line1;
    const zip = addr.zip_code || addr.zipCode || addr.postal_code;
    const city = addr.city;
    const state = addr.state || addr.region;
    const name = addr.name || addr.first_name;
    
    return !!(line1 && zip && city && state && name);
  };

  // 🔧 Address normalization helper - ensures both legacy and DB keys
  const normalizeAddress = (addr: any, recipientName: string): any => {
    // Extract values supporting all key formats
    const line1 = addr.address_line1 || addr.address || addr.line1 || '';
    const line2 = addr.address_line2 || addr.addressLine2 || addr.line2 || '';
    const zip = addr.zip_code || addr.zipCode || addr.postal_code || '';
    const city = addr.city || '';
    const state = addr.state || addr.region || '';
    const country = addr.country || 'US';
    const name = addr.name || addr.first_name || recipientName;
    
    // Return object with BOTH legacy and DB keys for compatibility
    return {
      // Legacy keys (for frontend compatibility)
      name,
      address: line1,
      addressLine2: line2,
      city,
      state,
      zipCode: zip,
      country,
      
      // DB keys (for backend processing)
      address_line1: line1,
      address_line2: line2,
      zip_code: zip,
      
      // Additional fields
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || ''
    };
  };

  // Auto-reconcile addresses on checkout load
  useEffect(() => {
    const reconcileAddresses = async () => {
      for (const group of deliveryGroups) {
        const addr = group.shippingAddress;
        if (!addr) continue;
        
        if (!isCompleteAddress(addr) && group.connectionId) {
          try {
            const recipient = await unifiedRecipientService.getRecipientById(group.connectionId);
            if (recipient?.address && isCompleteAddress(recipient.address)) {
              // Update all items in this delivery group with normalized complete address (silently)
              for (const productId of group.items) {
                updateRecipientAssignment(productId, {
                  shippingAddress: normalizeAddress(recipient.address, recipient.name)
                }, true); // silent = true to suppress toast
              }
              
              console.log(`🔧 Reconciled address for ${recipient.name}`);
            }
          } catch (error) {
            console.warn(`⚠️ Could not reconcile address for group ${group.connectionId}:`, error);
          }
        }
      }
    };
    
    if (deliveryGroups.length > 0) {
      reconcileAddresses();
    }
  }, [deliveryGroups, updateRecipientAssignment]);

  // Fetch real shipping costs when checkout data changes
  useEffect(() => {
    const fetchShippingCost = async () => {
      if (checkoutData.shippingInfo.zipCode && cartItems.length > 0) {
        console.log('🚢 Fetching shipping cost for zip:', checkoutData.shippingInfo.zipCode);
        setIsLoadingShipping(true);
        setShippingCostLoaded(false);
        try {
          const cost = await getShippingCost();
          console.log('✅ Shipping cost fetched:', cost);
          setShippingCost(cost);
          setShippingCostLoaded(true);
        } catch (error) {
          console.error('❌ Failed to fetch shipping cost:', error);
          setShippingCost(6.99); // Fallback
          setShippingCostLoaded(true);
        } finally {
          setIsLoadingShipping(false);
        }
      }
    };
    
    fetchShippingCost();
  }, [checkoutData.shippingInfo.zipCode, cartItems.length]);

  /*
   * 🔗 CRITICAL: Checkout Session Creation
   * 
   * V2 MODERNIZATION: Create Checkout Session that redirects to Stripe hosted page.
   * Order will be created by webhook after payment succeeds.
   */
  // Guest checkout supported - generate guest session ID if no user
  const guestSessionId = !user ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

  const createCheckoutSession = async () => {

    // 🚨 CRITICAL: Wait for shipping cost to load before creating payment intent
    if (isLoadingShipping || shippingCost === null || !shippingCostLoaded) {
      console.warn('⚠️ Waiting for shipping cost to load...');
      toast.error('Loading shipping cost, please wait...');
      return;
    }

    // 🛡️ CRITICAL VALIDATION: Ensure shipping cost is correct
    console.log('💰 Shipping cost validation:', {
      shippingCost,
      isLoadingShipping,
      shippingCostLoaded,
      subtotal,
      willChargeShipping: subtotal < 25,
      expectedCost: subtotal >= 25 ? 0 : 6.99
    });

    if (shippingCost === null) {
      console.error('🚨 CRITICAL: Shipping cost not loaded - cannot create payment intent');
      toast.error('Shipping calculation error. Please refresh and try again.');
      return;
    }

    if (subtotal < 25 && shippingCost === 0) {
      console.error('🚨 CRITICAL: Order under $25 but shipping is $0!');
      toast.error('Shipping calculation error. Please refresh and try again.');
      return;
    }

    // Validate guest email for non-logged-in users
    if (!user && !checkoutData.shippingInfo.email?.trim()) {
      console.error('🚨 Guest checkout requires email');
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsProcessing(true);
      setInitError(null); // Clear any previous errors
      
      console.log('💳 Creating payment intent (order will be created after payment)...');
      console.log('🔍 DEBUG - checkoutData.shippingInfo:', JSON.stringify(checkoutData.shippingInfo, null, 2));
      
      // 🎯 PREFLIGHT ADDRESS ENRICHMENT - Ensure all delivery groups have complete addresses
      console.log('🔍 Starting preflight address enrichment...');
      
      // Check if this is a wishlist purchase (registry-style fulfillment)
      const isRegistryPurchase = cartItems.every(item => item.wishlist_owner_shipping);
      
      let enrichedDeliveryGroups;
      
      if (isRegistryPurchase && deliveryGroups.length === 0) {
        // Registry-style: Create synthetic delivery group using wishlist owner's shipping
        console.log('🎁 Registry-style purchase detected - using wishlist owner shipping');
        const ownerShipping = cartItems[0].wishlist_owner_shipping;
        
        enrichedDeliveryGroups = [{
          id: `wishlist_${cartItems[0].wishlist_id}`,
          connectionId: cartItems[0].wishlist_owner_id || 'wishlist_owner',
          connectionName: cartItems[0].wishlist_owner_name || 'Gift Recipient',
          items: cartItems.map(item => item.product.product_id || item.product.id),
          shippingAddress: normalizeAddress(ownerShipping, cartItems[0].wishlist_owner_name || 'Gift Recipient')
        }];
      } else {
        // Standard flow: Enrich delivery groups from recipient profiles
        enrichedDeliveryGroups = await Promise.all(
          deliveryGroups.map(async (group) => {
            let currentAddress = group.shippingAddress;
            
            // Check if address is already complete
            if (isCompleteAddress(currentAddress)) {
              console.log(`✅ Group ${group.connectionName} already has complete address`);
              return {
                ...group,
                shippingAddress: normalizeAddress(currentAddress, group.connectionName)
              };
            }
            
            // Address incomplete - try to enrich from recipient profile
            console.log(`🔄 Enriching address for ${group.connectionName}...`);
            
            try {
              const recipient = await unifiedRecipientService.getRecipientById(group.connectionId);
              
              if (recipient?.address && isCompleteAddress(recipient.address)) {
                console.log(`✅ Enriched ${group.connectionName} from profile`);
                return {
                  ...group,
                  shippingAddress: normalizeAddress(recipient.address, group.connectionName)
                };
              }
            } catch (error) {
              console.error(`❌ Failed to fetch recipient ${group.connectionName}:`, error);
            }
            
            // Still incomplete - BLOCK payment
            const errorMsg = `Complete shipping address required for ${group.connectionName}. Please update their address in cart.`;
            console.error('🚨 ADDRESS VALIDATION FAILED:', errorMsg);
            throw new Error(errorMsg);
          })
        );
      }

      console.log('✅ Preflight enrichment complete:', 
        enrichedDeliveryGroups.map(g => ({
          name: g.connectionName,
          has_line1: !!g.shippingAddress.address_line1,
          has_line2: !!g.shippingAddress.address_line2,
          has_zip: !!g.shippingAddress.zip_code
        }))
      );
      
      // Prepare cart snapshot and metadata (no order creation yet)
      const zmaCompatibleShippingInfo = {
        name: checkoutData.shippingInfo.name,
        email: checkoutData.shippingInfo.email,
        address: checkoutData.shippingInfo.address,
        addressLine2: checkoutData.shippingInfo.addressLine2,
        city: checkoutData.shippingInfo.city,
        state: checkoutData.shippingInfo.state,
        zipCode: checkoutData.shippingInfo.zipCode,
        country: checkoutData.shippingInfo.country,
        address_line1: checkoutData.shippingInfo.address,
        address_line2: checkoutData.shippingInfo.addressLine2 || '',
        zip_code: checkoutData.shippingInfo.zipCode
      };

      console.log('🔍 DEBUG - zmaCompatibleShippingInfo built:', JSON.stringify(zmaCompatibleShippingInfo, null, 2));

      // V2: All cart data stored in Stripe Checkout Session metadata
      console.log('✅ Using Stripe Checkout Sessions (legacy tables removed)');


      // Create checkout session (V2 modernized approach)
      const { data, error } = await invokeWithAuthRetry('create-checkout-session', {
        body: {
          cartItems: cartItems.map(item => ({
            product_id: item.product.product_id || item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image_url: item.product.image || item.product.images?.[0],
            recipientAssignment: item.recipientAssignment
          })),
          deliveryGroups: enrichedDeliveryGroups,
          shippingInfo: zmaCompatibleShippingInfo,
          giftOptions: giftOptions,
          scheduledDeliveryDate: deliveryGroups[0]?.scheduledDeliveryDate || null,
          pricingBreakdown: {
            subtotal,
            shippingCost,
            giftingFee,
            giftingFeeName,
            giftingFeeDescription,
            taxAmount
          },
          metadata: {
            user_id: user?.id || null,
            guest_session_id: guestSessionId,
            // Always send email for graceful fallback if auth fails
            guest_email: checkoutData.shippingInfo.email,
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            is_wishlist_purchase: isWishlistPurchase || false
          }
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        const errorMsg = 'Failed to initialize checkout. Please try again.';
        setInitError(errorMsg);
        toast.error(errorMsg);
        setIsProcessing(false);
        return;
      }

      if (data?.url) {
        console.log('✅ Checkout session created, redirecting to Stripe...');
        setCheckoutUrl(data.url); // Store for manual fallback
        setIsRedirecting(true);
        toast.success('Redirecting to secure checkout...');
        
        // Safety timeout - if redirect doesn't happen in 5 seconds
        const redirectTimeout = setTimeout(() => {
          console.warn('⚠️ Redirect timeout - manual intervention required');
          setIsProcessing(false);
          setIsRedirecting(false);
          toast.error('Automatic redirect failed. Please use the button below to open checkout.');
        }, 5000);
        
        // Attempt automatic redirect (iframe-aware)
        setTimeout(() => {
          try {
            // If in iframe (Preview), open in new tab; otherwise normal redirect
            if (window.self !== window.top) {
              window.open(data.url, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = data.url;
            }
            // If redirect succeeds, user leaves page and timeout never fires
          } catch (redirectError) {
            console.error('❌ Redirect blocked:', redirectError);
            clearTimeout(redirectTimeout);
            setIsProcessing(false);
            setIsRedirecting(false);
            toast.error('Redirect was blocked. Click the button below to proceed.');
          }
        }, 800);
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error: any) {
      console.error('💥 Error in createPaymentIntent:', error);
      const errorMsg = error?.message || 'Failed to initialize payment. Please check addresses and try again.';
      setInitError(errorMsg);
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  /*
   * 🔗 SIMPLIFIED: Payment Success Handler
   * 
   * ✅ NEW APPROACH (Post-Webhook Migration):
   * - Stripe webhook is the SINGLE SOURCE OF TRUTH for order creation
   * - Frontend simply clears cart and navigates after payment success
   * - No polling, no redundant order creation, no race conditions
   * - Webhook handles: order creation, order items, cart completion, email, ZMA processing
   * 
   * 🗑️ DEPRECATED (Old system - removed):
   * - Database polling for order creation (lines 354-376)
   * - Redundant markCartCompleted() calls (webhook already does this)
   * - Manual ZMA processing triggers (webhook auto-triggers)
   */

  // Redirect if no items in cart
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some items to your cart before checking out</p>
          <Button onClick={() => navigate("/marketplace")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modern Branded Loading Overlay - Shows during redirect to Stripe */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-10 max-w-lg mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              {/* Elyphant Logo */}
              <div className="flex justify-center">
                <img 
                  src="/lovable-uploads/12c8902c-9c47-4b7f-8861-6cfd13ec628b.png" 
                  alt="Elyphant" 
                  className="h-20 w-auto"
                />
              </div>
              
              {/* Primary Message */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Completing Your Secure Checkout
                </h2>
                <p className="text-base text-muted-foreground">
                  Please wait while we prepare your payment session
                </p>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-shimmer"></div>
              </div>
              
              {/* Secondary Message */}
              <p className="text-sm text-muted-foreground">
                Redirecting to Stripe for payment processing...
              </p>
              
              {/* Manual fallback section */}
              {checkoutUrl && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Redirect not working?
                  </p>
                  <Button
                    onClick={() => {
                      window.open(checkoutUrl, '_blank');
                      toast.info('Opening checkout in new tab...');
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Open Checkout Manually
                  </Button>
                </div>
              )}
              
              {/* Stripe Trust Badge */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-3 opacity-70">
                  <svg className="h-8 w-8 text-foreground" viewBox="0 0 60 25" fill="currentColor">
                    <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" />
                  </svg>
                  <span className="text-sm text-muted-foreground font-medium">Secured by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    <div className="w-full max-w-full overflow-x-hidden">
      {/* iOS-Style Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                triggerHapticFeedback(HapticPatterns.navigationTap);
                navigate('/cart');
              }}
              className="h-11 w-11 touch-target-44"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Checkout</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Review your order and complete payment</p>
            </div>
          </div>
          
          {/* Lululemon-style Step Indicator */}
          <CheckoutProgressIndicator currentStep="shipping" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 max-w-4xl mobile-container pb-40 lg:pb-8">

        <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Checkout Content - Mobile: Stack vertically */}
          <div className="w-full lg:col-span-2 space-y-4 lg:space-y-6 min-w-0">
          
          {/* Registry-Style Wishlist Purchase: Show owner shipping info */}
          {isWishlistPurchase && wishlistOwnerInfo ? (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">
                      Shipping to {wishlistOwnerInfo.name}'s address
                    </p>
                    <p className="text-sm text-purple-600">
                      {wishlistOwnerInfo.shipping?.city}, {wishlistOwnerInfo.shipping?.state}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Full address provided securely to our delivery partner
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Standard Shipping Review Section - Mobile: Collapsible */
            <CheckoutShippingReview shippingCost={shippingCost} />
          )}
          
          {/* Guest Email Collection - For non-logged-in users buying from wishlists */}
          {!user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Your Email <span className="text-destructive">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="guest-email">Email address</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder="Enter your email for order confirmation"
                    value={checkoutData.shippingInfo.email}
                    onChange={(e) => {
                      handleUpdateShippingInfo({ email: e.target.value });
                      if (guestEmailTouched) {
                        setGuestEmailError(validateGuestEmail(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      setGuestEmailTouched(true);
                      setGuestEmailError(validateGuestEmail(checkoutData.shippingInfo.email || ''));
                    }}
                    required
                    className={`mt-1 ${guestEmailError && guestEmailTouched ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {guestEmailError && guestEmailTouched && (
                    <p className="text-sm text-destructive mt-1">{guestEmailError}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send your order confirmation, tracking details, and a special offer to join Elyphant.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Section - Mobile: Full width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-2 flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span>You'll be redirected to Stripe's secure payment page to complete your purchase. Your payment information is protected by bank-level encryption.</span>
              </p>
            </CardHeader>
            <CardContent>
              {initError ? (
                <div className="text-center py-8 space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{initError}</AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        setInitError(null);
                        createCheckoutSession();
                      }}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/cart')}
                      className="w-full"
                    >
                      Fix Addresses in Cart
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground hidden lg:block">
                    Click the button below to proceed to secure checkout.
                  </p>
                  {/* Desktop/Tablet inline button - hidden on phone (sticky bar used instead) */}
                  <Button
                    onClick={createCheckoutSession}
                    disabled={isProcessing || !addressesLoaded || !shippingCostLoaded || !isGuestEmailValid}
                    className="w-full hidden md:flex"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

          {/* Order Summary Sidebar - Mobile: Full width, stacked */}
          <div className="w-full lg:col-span-1 order-first lg:order-last min-w-0">
            <div className="lg:sticky lg:top-6">
              <CheckoutOrderSummary
                items={cartItems}
                subtotal={subtotal}
                shippingCost={shippingCost}
                giftingFee={giftingFee}
                giftingFeeName={giftingFeeName}
                giftingFeeDescription={giftingFeeDescription}
                taxAmount={taxAmount}
                isLoadingShipping={isLoadingShipping}
                totalAmount={totalAmount}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Bottom CTA Bar - Phone Only (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40 pb-safe md:hidden">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">
              {isLoadingShipping ? 'Calculating...' : formatPrice(totalAmount)}
            </p>
          </div>
          <Button
            onClick={() => {
              triggerHapticFeedback(HapticPatterns.buttonTap);
              createCheckoutSession();
            }}
            disabled={isProcessing || !addressesLoaded || !shippingCostLoaded || !isGuestEmailValid}
            className="flex-1 max-w-[200px] min-h-[44px] bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 touch-action-manipulation"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default UnifiedCheckoutForm;
