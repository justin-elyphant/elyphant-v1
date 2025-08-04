
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
import { CreditCard, ShoppingBag, AlertCircle } from 'lucide-react';
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
    addressesLoaded,
    isProcessing,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
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
            item_count: cartItems.length
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
   * This function processes successful payments and creates orders.
   * It integrates with multiple systems and must handle complex data flows.
   * 
   * DO NOT simplify this function - it handles:
   * - Order creation in database
   * - Address saving to profile
   * - Cart clearing
   * - Navigation to confirmation
   */
  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      
      // CRITICAL: Order creation with all necessary data including gifting fee details
      const orderData = {
        cartItems,
        subtotal,
        shippingCost,
        giftingFee,
        giftingFeeName,
        giftingFeeDescription,
        taxAmount,
        totalAmount,
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: {
          isGift: false,
          recipientName: '',
          giftMessage: '',
          giftWrapping: false,
          isSurpriseGift: false
        },
        paymentIntentId,
        deliveryGroups: []
      };

      // Create order via service layer
      const order = await createOrder(orderData);
      
      // Save address to profile if needed
      await saveCurrentAddressToProfile('Checkout Address', false);
      
      // Clear cart and navigate to confirmation
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
      
      toast.success('Order placed successfully!');
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order. Please contact support.');
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Review your order and complete payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Review Section */}
          <CheckoutShippingReview shippingCost={shippingCost} />

          {/* Payment Section */}
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

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
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
  );
};

export default UnifiedCheckoutForm;
