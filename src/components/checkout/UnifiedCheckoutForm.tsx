
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
import { Button } from '@/components/ui/button';
import { useCartSessionTracking } from '@/hooks/useCartSessionTracking';

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
  const { cartItems, clearCart } = useCart();
  
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

  // Calculate totals - CRITICAL: This logic must match order creation
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Track cart session for abandoned cart detection
  const { markCartCompleted } = useCartSessionTracking(cartItems, subtotal, true);
  
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

  // Fetch real shipping costs when checkout data changes
  useEffect(() => {
    const fetchShippingCost = async () => {
      if (checkoutData.shippingInfo.zipCode && cartItems.length > 0) {
        console.log('🚢 Fetching shipping cost for zip:', checkoutData.shippingInfo.zipCode);
        setIsLoadingShipping(true);
        try {
          const cost = await getShippingCost();
          console.log('✅ Shipping cost fetched:', cost);
          setShippingCost(cost);
        } catch (error) {
          console.error('❌ Failed to fetch shipping cost:', error);
          setShippingCost(6.99); // Fallback
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

    try {
      setIsProcessing(true);
      
      console.log('💳 Creating payment intent (order will be created after payment)...');
      
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

      // Get or create cart session
      const sessionId = localStorage.getItem('cart_session_id') || crypto.randomUUID();
      localStorage.setItem('cart_session_id', sessionId);

      // Save cart data to cart_sessions table
      const { error: sessionError } = await supabase
        .from('cart_sessions')
        .upsert([{
          session_id: sessionId,
          user_id: user.id,
          cart_data: {
            cartItems: cartItems.map(item => ({
              product_id: item.product.product_id,
              title: item.product.title,
              price: item.product.price,
              quantity: item.quantity,
              image: item.product.image
            })),
            subtotal,
            shippingCost: shippingCost ?? 0,
            giftingFee,
            giftingFeeName,
            giftingFeeDescription,
            taxAmount,
            totalAmount,
            shippingInfo: zmaCompatibleShippingInfo,
            giftOptions: {
              isGift: giftOptions.isGift,
              recipientName: giftOptions.recipientName,
              giftMessage: giftOptions.giftMessage,
              giftWrapping: giftOptions.giftWrapping,
              isSurpriseGift: giftOptions.isSurpriseGift,
              scheduleDelivery: giftOptions.scheduleDelivery,
              sendGiftMessage: giftOptions.sendGiftMessage,
              scheduledDeliveryDate: giftOptions.scheduledDeliveryDate
            },
            deliveryGroups: []
          } as any,
          total_amount: totalAmount,
          checkout_initiated_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }], {
          onConflict: 'session_id'
        });

      if (sessionError) {
        console.error('❌ Failed to save cart session:', sessionError);
        toast.error('Failed to save cart data. Please try again.');
        return;
      }

      console.log('✅ Cart session saved:', sessionId);

      // Create payment intent with session ID (short!)
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          metadata: {
            user_id: user.id,
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            cart_session_id: sessionId,
            scheduledDeliveryDate: giftOptions.scheduledDeliveryDate || '',
            isScheduledDelivery: Boolean(giftOptions.scheduleDelivery && giftOptions.scheduledDeliveryDate),
            deliveryDate: giftOptions.scheduledDeliveryDate
          }
        }
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        toast.error('Failed to initialize payment. Please try again.');
        return;
      }

      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
      console.log('✅ Payment intent created (order will be created by webhook after payment)');
      
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /*
   * 🔗 CRITICAL: Payment Success Handler
   * 
   * HYBRID FIX: Order will be created by webhook, just wait for it and navigate
   */
  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      console.log('🎉 Payment successful, waiting for order creation...');
      
      // Polling: Wait for webhook to create order (with timeout)
      let order = null;
      let attempts = 0;
      const maxAttempts = 10; // 10 attempts = 5 seconds max wait
      
      while (!order && attempts < maxAttempts) {
        attempts++;
        console.log(`🔍 Checking for order (attempt ${attempts}/${maxAttempts})...`);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (data) {
          order = data;
          console.log('✅ Order found:', order.id);
          break;
        }
        
        // Wait 500ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!order) {
        console.warn('⚠️ Order not created yet by webhook, but payment succeeded');
        toast.success('Payment successful! Your order is being processed...');
        
        // Navigate to orders page since we don't have order ID yet
        clearCart();
        await markCartCompleted();
        navigate('/orders');
        return;
      }
      
      // Email will be sent by ecommerce-email-orchestrator via webhook/process-zma-order
      console.log('📧 Email will be sent automatically via ecommerce-email-orchestrator');
      
      // Save address to profile if needed
      try {
        await saveCurrentAddressToProfile('Checkout Address', false);
        console.log('📍 Address saved to profile');
      } catch (addressError) {
        console.warn('⚠️ Failed to save address to profile:', addressError);
        // Don't fail the order for address saving issues
      }

      // Webhook will handle ZMA processing automatically
      console.log('✅ Payment succeeded - webhook will process order');
      toast.success('Payment successful! Processing your order...');
      
      // CRITICAL: Always clear cart and navigate - regardless of ZMA processing status
      console.log('🧹 Clearing cart and navigating to confirmation...');
      
      // Mark cart session as completed before clearing
      await markCartCompleted();
      
      clearCart();
      console.log('🛒 Cart cleared successfully');
      
      console.log(`🧭 Navigating to order confirmation: /order-confirmation/${order.id}`);
      navigate(`/order-confirmation/${order.id}`);
      
    } catch (error: any) {
      console.error('💥 Post-payment error:', error);
      
      // Payment succeeded but something went wrong after
      toast.error('Payment successful but there was an issue. Please check your orders page.');
      
      // Try to clear cart and navigate to orders
      try {
        await markCartCompleted();
        clearCart();
        navigate('/orders');
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

  // Initialize payment intent when component mounts
  useEffect(() => {
    if (user && cartItems.length > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [user, cartItems.length, clientSecret]);

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
              {clientSecret ? (
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
