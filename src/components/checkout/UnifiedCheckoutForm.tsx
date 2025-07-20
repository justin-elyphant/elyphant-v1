
import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart, AlertCircle } from 'lucide-react';
import UnifiedShippingForm from './UnifiedShippingForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import RecipientAssignmentSection from '@/components/cart/RecipientAssignmentSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UnifiedCheckoutForm: React.FC = () => {
  const { cartItems, cartTotal } = useCart();
  const { calculatePriceBreakdown } = usePricingSettings();
  
  // Payment intent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);
  
  const {
    activeTab,
    isProcessing,
    setIsProcessing,
    checkoutData,
    addressesLoaded,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost,
    saveCurrentAddressToProfile
  } = useCheckoutState();

  // For now, we'll use simple shipping options - this can be enhanced later
  const shippingOptions = [
    { id: 'standard', name: 'Standard Shipping', price: 6.99, delivery_time: '5-7 business days' }
  ];
  const isLoadingShipping = false;

  const shippingCost = getShippingCost();
  const priceBreakdown = calculatePriceBreakdown(cartTotal, shippingCost);
  const taxAmount = cartTotal * 0.0825; // 8.25% tax rate
  const totalAmount = priceBreakdown.total + taxAmount;

  const createPaymentIntent = async () => {
    if (isCreatingPaymentIntent || clientSecret) return;

    try {
      setIsCreatingPaymentIntent(true);
      setPaymentIntentError(null);

      console.log('Creating payment intent for amount:', totalAmount);

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            shipping_method: checkoutData.shippingMethod
          }
        }
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data?.client_secret) {
        throw new Error('No client secret returned from payment intent creation');
      }

      console.log('Payment intent created successfully');
      setClientSecret(data.client_secret);
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      setPaymentIntentError(error.message || 'Failed to prepare payment. Please try again.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  // Reset payment intent when cart or total changes
  useEffect(() => {
    if (clientSecret) {
      console.log('Cart or total changed, resetting payment intent');
      setClientSecret(null);
      setPaymentIntentError(null);
    }
  }, [cartTotal, cartItems.length]);

  const isShippingComplete = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canContinueToPayment = () => {
    return isShippingComplete() && checkoutData.shippingMethod;
  };

  const handleContinueToPayment = async () => {
    if (canContinueToPayment()) {
      handleTabChange('payment');
      // Create payment intent when moving to payment tab
      if (!clientSecret && !isCreatingPaymentIntent) {
        await createPaymentIntent();
      }
    }
  };

  const handleBackToShipping = () => {
    handleTabChange('shipping');
  };

  // Create payment intent when payment tab is accessed directly
  useEffect(() => {
    if (activeTab === 'payment' && !clientSecret && !isCreatingPaymentIntent && canContinueToPayment()) {
      createPaymentIntent();
    }
  }, [activeTab, clientSecret, isCreatingPaymentIntent]);

  if (!addressesLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading checkout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          <Shield className="h-3 w-3" />
          Secure Checkout
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Flow */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shipping">Shipping & Gifts</TabsTrigger>
              <TabsTrigger value="payment" disabled={!canContinueToPayment()}>
                Payment & Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="space-y-6 mt-6">
              {/* Shipping Information */}
              <UnifiedShippingForm
                shippingInfo={checkoutData.shippingInfo}
                onUpdate={handleUpdateShippingInfo}
                selectedShippingMethod={checkoutData.shippingMethod}
                onShippingMethodChange={(method) => 
                  handleUpdateShippingInfo({ shippingMethod: method } as any)
                }
                shippingOptions={shippingOptions}
                isLoadingShipping={isLoadingShipping}
              />

              {/* Gift Recipients */}
              <Card>
                <CardHeader>
                  <CardTitle>Gift Recipients & Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecipientAssignmentSection />
                </CardContent>
              </Card>

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleContinueToPayment}
                  disabled={!canContinueToPayment()}
                  className="flex items-center gap-2"
                >
                  Continue to Payment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToShipping}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Shipping
                </Button>
              </div>

              {/* Payment Intent Creation Status */}
              {isCreatingPaymentIntent && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Preparing secure payment...
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {paymentIntentError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{paymentIntentError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createPaymentIntent}
                      disabled={isCreatingPaymentIntent}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Method Selection */}
              <PaymentMethodSelector
                clientSecret={clientSecret || "placeholder"}
                totalAmount={totalAmount}
                onPaymentSuccess={(paymentIntentId, paymentMethodId) => {
                  console.log('Payment successful:', paymentIntentId, paymentMethodId);
                }}
                onPaymentError={(error) => {
                  console.error('Payment error:', error);
                }}
                isProcessingPayment={isProcessing}
                onProcessingChange={setIsProcessing}
                refreshKey={0}
                onRefreshKeyChange={() => {}}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <CheckoutOrderSummary
            items={cartItems}
            subtotal={cartTotal}
            shippingCost={shippingCost}
            giftingFee={priceBreakdown.giftingFee}
            giftingFeeName={priceBreakdown.giftingFeeName}
            giftingFeeDescription={priceBreakdown.giftingFeeDescription}
            taxAmount={taxAmount}
            totalAmount={totalAmount}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
