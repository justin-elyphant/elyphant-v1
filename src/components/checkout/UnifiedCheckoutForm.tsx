
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
 * - PaymentMethodSelector: Manages Stripe payment processing
 * - RecipientAssignmentSection: Handles gift recipient assignments
 * - Supabase edge functions: create-payment-intent, verify-payment-intent
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
import { extractBillingInfoFromPaymentMethod } from '@/services/billingService';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ShoppingBag, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// CRITICAL: These imports are essential for the checkout system
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import PaymentMethodSelector from './PaymentMethodSelector';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import CheckoutShippingReview from './CheckoutShippingReview';
import { supabase } from '@/integrations/supabase/client';
import { usePricingSettings } from '@/hooks/usePricingSettings';

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
  
  // CRITICAL: This hook manages all checkout state and validation
  const {
    activeTab,
    checkoutData,
    giftOptions,
    addressesLoaded,
    isProcessing,
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
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(true);
  const [shippingCostLoaded, setShippingCostLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);

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

  // 🔒 PAYMENT INTENT STALENESS FIX: Clear payment intent when cart changes
  // This prevents users from paying with outdated payment intents from previous cart states
  useEffect(() => {
    const cartSignature = cartItems.map(i => `${i.product.product_id}:${i.quantity}`).join(',');
    if (clientSecret && cartSignature) {
      console.log('🔄 Cart changed - clearing stale payment intent');
      setClientSecret('');
      setPaymentIntentId('');
    }
  }, [cartItems.map(i => `${i.product.product_id}:${i.quantity}`).join(',')]);

  /*
   * 🔗 CRITICAL: Payment Intent Creation
   * 
   * HYBRID FIX: Don't create order on page load - only create payment intent
   * with cart snapshot in metadata. Order will be created after payment succeeds.
   */
  const createPaymentIntent = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

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

    try {
      setIsProcessing(true);
      setInitError(null); // Clear any previous errors
      
      console.log('💳 Creating payment intent (order will be created after payment)...');
      console.log('🔍 DEBUG - checkoutData.shippingInfo:', JSON.stringify(checkoutData.shippingInfo, null, 2));
      
      // 🎯 PREFLIGHT ADDRESS ENRICHMENT - Ensure all delivery groups have complete addresses
      console.log('🔍 Starting preflight address enrichment...');
      
      const enrichedDeliveryGroups = await Promise.all(
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

      // V2: All cart data will be in payment intent metadata (no cart_sessions)
      console.log('✅ Skipping cart_sessions table - using metadata-based approach');


      // Create payment intent with v2 endpoint (metadata-based)
      const { data, error } = await invokeWithAuthRetry('create-payment-intent-v2', {
        body: {
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          cartItems: cartItems.map(item => ({
            product_id: item.product.product_id || item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image_url: item.product.image || item.product.images?.[0],
            recipientAssignment: item.recipientAssignment
          })),
          shippingInfo: checkoutData.shippingInfo,
          giftOptions: giftOptions,
          deliveryGroups: deliveryGroups,
          metadata: {
            user_id: user.id,
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            scheduledDeliveryDate: giftOptions.scheduledDeliveryDate || '',
            isScheduledDelivery: Boolean(giftOptions.scheduleDelivery && giftOptions.scheduledDeliveryDate),
            deliveryDate: giftOptions.scheduledDeliveryDate
          }
        }
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        const errorMsg = 'Failed to initialize payment. Please try again.';
        setInitError(errorMsg);
        toast.error(errorMsg);
        setIsProcessing(false);
        return;
      }

      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
      console.log('✅ Payment intent created (order will be created by webhook after payment)');
      
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
  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      console.log('🎉 Payment successful! Stripe webhook will create order...');
      
      // 💳 EXTRACT BILLING INFO from Stripe PaymentMethod (stored in metadata)
      let billingInfo = null;
      if (paymentMethodId) {
        try {
          console.log('💳 Extracting billing info from payment method:', paymentMethodId);
          const { data: paymentMethodData, error: pmError } = await supabase.functions.invoke(
            'get-payment-method-details',
            { body: { paymentMethodId } }
          );
          
          if (pmError) {
            console.error('⚠️ Failed to retrieve payment method:', pmError);
          } else if (paymentMethodData?.data) {
            billingInfo = extractBillingInfoFromPaymentMethod(paymentMethodData.data);
            console.log('✅ Billing info extracted:', billingInfo);
            
            console.log('✅ Billing info extracted:', billingInfo);
          }
        } catch (billingError) {
          console.error('⚠️ Failed to extract billing info:', billingError);
          // Continue with null billing info (fallback to shipping address)
        }
      }
      
      // Save address to profile if needed
      try {
        await saveCurrentAddressToProfile('Checkout Address', false);
        console.log('📍 Address saved to profile');
      } catch (addressError) {
        console.warn('⚠️ Failed to save address to profile:', addressError);
        // Don't fail checkout for address saving issues
      }

      // Show success message
      toast.success('Payment successful! Your order is being processed...');
      
      // Clear cart and navigate to order confirmation
      // Webhook creates order asynchronously using payment_intent_id
      console.log('🧹 Clearing cart and navigating to confirmation...');
      clearCart();
      console.log('🛒 Cart cleared successfully');
      
      // Navigate to order confirmation page with payment intent ID
      console.log('🧭 Navigating to order confirmation page');
      navigate(`/order-confirmation/${paymentIntentId}`);
      
    } catch (error: any) {
      console.error('💥 Post-payment error:', error);
      
      // Payment succeeded but something went wrong after
      toast.error('Payment successful but there was an issue. Please check your orders page.');
      
      // Try to clear cart and navigate to orders (fallback on error)
      try {
        clearCart();
        navigate('/orders'); // Fallback to orders page on error
      } catch (navError) {
        console.error('Failed to navigate:', navError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(`Payment failed: ${error}`);
  };

  // Initialize payment intent only after addresses AND shipping cost are loaded
  useEffect(() => {
    if (user && cartItems.length > 0 && !clientSecret && addressesLoaded && shippingCostLoaded && shippingCost !== null) {
      console.log('🎯 All data loaded - creating payment intent now');
      createPaymentIntent();
    } else if (user && cartItems.length > 0 && !clientSecret && addressesLoaded && !shippingCostLoaded) {
      console.log('⏳ Waiting for shipping cost to load before creating payment intent');
    }
  }, [user, cartItems.length, clientSecret, addressesLoaded, shippingCostLoaded, shippingCost]);

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
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-4xl mobile-container checkout-content-spacing">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cart')}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Checkout</h1>
          </div>
          <p className="text-muted-foreground ml-11">Review your order and complete payment</p>
        </div>

        <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Checkout Content - Mobile: Stack vertically */}
          <div className="w-full lg:col-span-2 space-y-4 lg:space-y-6 min-w-0">
          {/* Shipping Review Section - Mobile: Collapsible */}
          <CheckoutShippingReview shippingCost={shippingCost} />

          {/* Payment Section - Mobile: Full width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
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
                        createPaymentIntent();
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
              ) : clientSecret ? (
                /* CRITICAL: Payment method selector component */
                <PaymentMethodSelector
                  clientSecret={clientSecret}
                  totalAmount={totalAmount}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  isProcessingPayment={isProcessingPayment}
                  onProcessingChange={setIsProcessingPayment}
                  refreshKey={refreshKey}
                  onRefreshKeyChange={setRefreshKey}
                  onMethodSelected={(methodId) => {
                    setSelectedPaymentMethodId(methodId);
                    // Payment method selection tracked - attachment happens at confirmation
                  }}
                  shippingAddress={{
                    name: checkoutData.shippingInfo.name,
                    address: checkoutData.shippingInfo.address,
                    city: checkoutData.shippingInfo.city,
                    state: checkoutData.shippingInfo.state,
                    zipCode: checkoutData.shippingInfo.zipCode,
                    country: checkoutData.shippingInfo.country
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Initializing payment...</p>
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
    </div>
  );
};

export default UnifiedCheckoutForm;
