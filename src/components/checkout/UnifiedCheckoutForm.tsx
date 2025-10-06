
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
import { createOrder } from '@/services/orderService';
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

  // Calculate totals - CRITICAL: This logic must match order creation
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = getShippingCost();
  
  // 🚨 CRITICAL: Dynamic gifting fee calculation using pricing settings
  // ⚠️  NEVER hardcode giftingFee = 0 - this breaks the business model
  // 🔗 This integrates with Trunkline pricing controls for real-time updates
  const priceBreakdown = calculatePriceBreakdown(subtotal, shippingCost);
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
  const totalAmount = subtotal + shippingCost + giftingFee + taxAmount;

  /*
   * 🔗 CRITICAL: Payment Intent Creation
   * 
   * This function creates a Stripe payment intent via UnifiedPaymentService.
   * Week 2 Migration: Now uses UnifiedPaymentService for consistent orchestration.
   */
  const createPaymentIntent = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Week 2: Use UnifiedPaymentService for payment intent creation
      // This maintains the same functionality but routes through unified service
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            user_id: user.id,
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            // CRITICAL: Pass scheduled delivery information for proper payment handling
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
      console.log('Payment intent created successfully');
      
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
   * Enhanced to handle order creation errors gracefully and provide
   * better error recovery and user feedback. Now includes automatic
   * Zinc/ZMA processing for Amazon products.
   */
  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      console.log('🎉 Payment successful, creating order...', { paymentIntentId, paymentMethodId });
      
      // CRITICAL: Order creation with all necessary data including gifting fee details
      // Convert address format to ZMA-compatible format for proper processing
      const zmaCompatibleShippingInfo = {
        // Standard ShippingInfo interface fields (required)
        name: checkoutData.shippingInfo.name,
        email: checkoutData.shippingInfo.email,
        address: checkoutData.shippingInfo.address,
        addressLine2: checkoutData.shippingInfo.addressLine2,
        city: checkoutData.shippingInfo.city,
        state: checkoutData.shippingInfo.state,
        zipCode: checkoutData.shippingInfo.zipCode,
        country: checkoutData.shippingInfo.country,
        // ZMA-compatible fields (for proper processing)
        address_line1: checkoutData.shippingInfo.address,
        address_line2: checkoutData.shippingInfo.addressLine2 || '',
        zip_code: checkoutData.shippingInfo.zipCode
      };

      const orderData = {
        cartItems,
        subtotal,
        shippingCost,
        giftingFee,
        giftingFeeName,
        giftingFeeDescription,
        taxAmount,
        totalAmount,
        shippingInfo: zmaCompatibleShippingInfo,
        giftOptions,
        paymentIntentId,
        deliveryGroups: []
      };

      console.log('📋 Creating order with data:', {
        paymentIntentId,
        totalAmount,
        itemCount: cartItems.length,
        shippingInfo: checkoutData.shippingInfo
      });

      // Create order via service layer with enhanced error handling
      const order = await createOrder(orderData);
      console.log('✅ Order created successfully:', order.id);
      
      // 📧 Send order confirmation email (best-effort)
      try {
        const userEmail = checkoutData.shippingInfo.email;
        const paymentMethodUsed = paymentMethodId ? 'saved_payment_method' : 'card';
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
          body: {
            order_id: order.id,
            user_email: userEmail,
            payment_method_used: paymentMethodUsed
          }
        });
        if (emailError) {
          console.warn('⚠️ Failed to send confirmation email:', emailError);
        } else {
          console.log('📧 Order confirmation email queued:', emailResult);
        }
      } catch (emailException) {
        console.warn('⚠️ Exception while sending confirmation email:', emailException);
      }
      
      // Save address to profile if needed
      try {
        await saveCurrentAddressToProfile('Checkout Address', false);
        console.log('📍 Address saved to profile');
      } catch (addressError) {
        console.warn('⚠️ Failed to save address to profile:', addressError);
        // Don't fail the order for address saving issues
      }

      // 🚀 ENHANCED: Check for Amazon products and process through ZMA
      console.log('🔍 Checking for Amazon products in cart...', cartItems.map(item => ({
        product_id: item.product.product_id,
        retailer: item.product.retailer,
        vendor: item.product.vendor,
        productSource: item.product.productSource,
        isZincApiProduct: item.product.isZincApiProduct
      })));

      const amazonProducts = cartItems.filter(item => {
        const product = item.product;
        // ENHANCED: Comprehensive Zinc product detection with multiple fallback paths
        const isZinc = 
          // Primary indicators
          product.productSource === 'zinc_api' ||
          product.isZincApiProduct === true ||
          // Secondary indicators
          product.retailer === 'Amazon' ||
          product.vendor === 'Amazon' ||
          product.vendor === 'Amazon via Zinc' ||
          // Fallback case-insensitive checks
          (product.retailer && product.retailer.toLowerCase().includes('amazon')) ||
          (product.vendor && (product.vendor.toLowerCase().includes('amazon') || product.vendor.toLowerCase().includes('zinc')));
        
        console.log(`📦 Product ${product.product_id}: Zinc=${isZinc}`, {
          retailer: product.retailer,
          vendor: product.vendor,
          productSource: product.productSource,
          isZincApiProduct: product.isZincApiProduct,
          detectionPaths: {
            productSource: product.productSource === 'zinc_api',
            isZincFlag: product.isZincApiProduct === true,
            retailerExact: product.retailer === 'Amazon',
            vendorExact: product.vendor === 'Amazon' || product.vendor === 'Amazon via Zinc',
            retailerIncludes: product.retailer && product.retailer.toLowerCase().includes('amazon'),
            vendorIncludes: product.vendor && (product.vendor.toLowerCase().includes('amazon') || product.vendor.toLowerCase().includes('zinc'))
          }
        });
        
        return isZinc;
      });

      const hasAmazonProducts = amazonProducts.length > 0;

      // Order processing now happens via Stripe webhook ONLY
      // Removed direct process-zma-order call to eliminate dual-path duplicate submissions
      if (hasAmazonProducts) {
        console.log(`🛒 ${amazonProducts.length} Amazon products detected - will be processed by webhook`);
        toast.success('Order placed! Processing Amazon fulfillment...');
      } else {
        console.log('ℹ️ No Amazon products detected');
        toast.success('Order placed successfully!');
      }
      
      // CRITICAL: Always clear cart and navigate - regardless of ZMA processing status
      console.log('🧹 Clearing cart and navigating to confirmation...');
      clearCart();
      console.log('🛒 Cart cleared successfully');
      
      console.log(`🧭 Navigating to order confirmation: /order-confirmation/${order.id}`);
      navigate(`/order-confirmation/${order.id}`);
      
      // Don't show additional success toast if we already showed specific messages above
      
    } catch (error: any) {
      console.error('💥 Order creation error:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to process order. Please contact support.';
      
      if (error.message?.includes('order_items')) {
        errorMessage = 'There was an issue with your cart items. Please refresh the page and try again.';
      } else if (error.message?.includes('payment')) {
        errorMessage = 'Payment was successful but order creation failed. Please contact support with your payment confirmation.';
      } else if (error.message?.includes('address') || error.message?.includes('shipping')) {
        errorMessage = 'There was an issue with your shipping information. Please verify and try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
      
      // Provide recovery options in the UI
      setClientSecret(''); // Reset to allow retry
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
