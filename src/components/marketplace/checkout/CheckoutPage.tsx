
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { createOrder } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";

// Import optimized components
import ExpressCheckoutFlow from "./ExpressCheckoutFlow";
import SmartCheckoutForm from "./SmartCheckoutForm";
import CheckoutSummary from "./CheckoutSummary";
import ShippingOptionsForm from "./ShippingOptionsForm";
import PaymentSection from "./PaymentSection";
import GiftScheduling from "./GiftScheduling";
import { useCheckoutState } from "./useCheckoutState";
import { useAdaptiveCheckout } from "./useAdaptiveCheckout";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [isExpressMode, setIsExpressMode] = useState(false);
  
  const {
    activeTab,
    isProcessing,
    isLoadingShipping,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handleShippingMethodChange,
    handlePaymentMethodChange,
    handleGiftOptionsChange,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  const { deliveryScenario, adaptiveFlow } = useAdaptiveCheckout();

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = getShippingCost();
  const taxAmount = subtotal * 0.08; // 8% tax estimate
  const totalAmount = subtotal + shippingCost + taxAmount;

  const handleExpressCheckout = (type: 'self' | 'gift') => {
    setIsExpressMode(true);
    
    if (type === 'self') {
      // Skip to payment for self-purchase
      handleTabChange('payment');
    } else {
      // Go to gift setup
      handleTabChange('schedule');
      handleGiftOptionsChange({ isGift: true });
    }
    
    toast.success(`Express ${type === 'self' ? 'purchase' : 'gift'} mode activated`);
  };

  const handlePlaceOrder = async (paymentIntentId?: string) => {
    if (!user) {
      toast.error('Please sign in to place an order');
      return;
    }

    setIsProcessing(true);
    
    try {
      // For demo mode, create order without payment
      if (checkoutData.paymentMethod === 'demo') {
        const order = await createOrder({
          cartItems,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          shippingInfo: checkoutData.shippingInfo,
          giftOptions: checkoutData.giftOptions,
        });

        clearCart();
        toast.success('Demo order created successfully!');
        navigate(`/order-confirmation/${order.id}`);
        return;
      }

      // For real payments, create order with payment intent
      if (paymentIntentId) {
        const order = await createOrder({
          cartItems,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          shippingInfo: checkoutData.shippingInfo,
          giftOptions: checkoutData.giftOptions,
          paymentIntentId,
        });

        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order.id}`);
      } else {
        toast.error('Payment information is required');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrevious = () => {
    const currentIndex = adaptiveFlow.tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      handleTabChange(adaptiveFlow.tabs[currentIndex - 1]);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/marketplace')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cart')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Checkout</h1>
          {isExpressMode && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4" />
              Express Mode
            </div>
          )}
        </div>
        
        <p className="text-muted-foreground mt-2">
          {deliveryScenario === 'gift' ? 'Complete your gift purchase' : 
           deliveryScenario === 'mixed' ? 'Complete your mixed order' : 
           'Complete your purchase'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Express Checkout Option */}
          <ExpressCheckoutFlow onExpressCheckout={handleExpressCheckout} />

          {/* Main Checkout Flow */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
              {adaptiveFlow.tabs.map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="capitalize"
                >
                  {tab === 'delivery' ? 'Delivery' : 
                   tab === 'recipients' ? 'Recipients' :
                   tab === 'schedule' ? 'Schedule' :
                   tab === 'shipping' ? 'Shipping' : 
                   tab === 'payment' ? 'Payment' : tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              <SmartCheckoutForm
                shippingInfo={checkoutData.shippingInfo}
                onUpdate={handleUpdateShippingInfo}
                showBillingAddress={false}
                isGift={false}
              />
              
              <ShippingOptionsForm
                selectedMethod={checkoutData.shippingMethod}
                onSelect={handleShippingMethodChange}
                shippingOptions={checkoutData.shippingOptions}
                isLoading={isLoadingShipping}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleTabChange('payment')}
                  disabled={!checkoutData.selectedShippingOption}
                >
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <GiftScheduling 
                giftOptions={checkoutData.giftOptions}
                onChange={handleGiftOptionsChange}
              />
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  Back
                </Button>
                <Button onClick={() => handleTabChange('payment')}>
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6">
              <PaymentSection
                paymentMethod={checkoutData.paymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                canPlaceOrder={canPlaceOrder()}
                onPrevious={handlePrevious}
                totalAmount={totalAmount}
                cartItems={cartItems}
                shippingInfo={checkoutData.shippingInfo}
                giftOptions={checkoutData.giftOptions}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <CheckoutSummary
            shippingCost={shippingCost}
            taxAmount={taxAmount}
            estimatedDelivery={checkoutData.selectedShippingOption?.delivery_time}
            shippingMethod={checkoutData.selectedShippingOption?.name}
            showPriceLock={!isExpressMode}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
