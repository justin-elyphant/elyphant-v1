
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import UnifiedShippingSection from './UnifiedShippingSection';
import PaymentMethodSelector from './PaymentMethodSelector';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import RecipientAssignmentSection from '@/components/cart/RecipientAssignmentSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const UnifiedCheckoutForm: React.FC = () => {
  const { cartItems, cartTotal } = useCart();
  const { calculatePriceBreakdown } = usePricingSettings();
  
  const {
    activeTab,
    isProcessing,
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

  const isShippingComplete = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canContinueToPayment = () => {
    return isShippingComplete() && checkoutData.shippingMethod;
  };

  const handleContinueToPayment = () => {
    if (canContinueToPayment()) {
      handleTabChange('payment');
    }
  };

  const handleBackToShipping = () => {
    handleTabChange('shipping');
  };

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
              <UnifiedShippingSection
                shippingInfo={checkoutData.shippingInfo}
                onUpdateShippingInfo={handleUpdateShippingInfo}
                selectedShippingMethod={checkoutData.shippingMethod}
                onShippingMethodChange={(method) => 
                  handleUpdateShippingInfo({ shippingMethod: method } as any)
                }
                shippingOptions={shippingOptions}
                isLoadingShipping={isLoadingShipping}
                onSaveAddress={saveCurrentAddressToProfile}
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

              {/* Payment Method Selection */}
              <PaymentMethodSelector
                clientSecret="placeholder"
                totalAmount={totalAmount}
                onPaymentSuccess={() => {}}
                onPaymentError={() => {}}
                isProcessingPayment={isProcessing}
                onProcessingChange={() => {}}
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
