import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import PaymentMethodSelector from './PaymentMethodSelector';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import GiftOptionsForm from './components/GiftOptionsForm';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DeliveryGroup {
  recipientConnectionId: string;
  giftMessage: string;
  scheduledDeliveryDate: string;
}

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, cartTotal, getItemCount } = useCart();
  const { user } = useAuth();
  const {
    activeTab,
    isProcessing,
    checkoutData,
    addressesLoaded,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost,
    saveCurrentAddressToProfile
  } = useCheckoutState();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [giftOptions, setGiftOptions] = useState({
    giftMessage: '',
    scheduledDeliveryDate: '',
    specialInstructions: ''
  });

  const shippingCost = getShippingCost();
  const taxRate = 0.07; // 7% tax rate
  const taxAmount = cartTotal * taxRate;
  const totalAmount = cartTotal + shippingCost + taxAmount;

  useEffect(() => {
    // Create PaymentIntent as soon as the component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(totalAmount * 100) }),
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast.error("Failed to initiate payment. Please try again.");
      }
    };

    createPaymentIntent();
  }, [totalAmount]);

  const handleShippingSubmit = async () => {
    try {
      setIsProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing
      handleTabChange('gift');
    } catch (error) {
      console.error("Shipping info submission error:", error);
      toast.error("Failed to save shipping information. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGiftOptionsSubmit = async () => {
    try {
      setIsProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing
      handleTabChange('payment');
    } catch (error) {
      console.error("Gift options submission error:", error);
      toast.error("Failed to save gift options. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrder = async (paymentIntentId: string, paymentMethodId?: string) => {
    if (!checkoutData) {
      console.error("Checkout data is missing");
      toast.error("Checkout data is missing. Please review your information.");
      return;
    }

    try {
      setIsProcessingPayment(true);

      // For now, create a simple order object (implement proper order service later)
      const newOrder = {
        id: `order_${Date.now()}`,
        cartItems,
        subtotal: cartTotal,
        shippingCost,
        taxAmount,
        totalAmount,
        shippingInfo: checkoutData.shippingInfo,
        giftOptions,
        paymentIntentId
      };
      setOrderId(newOrder.id);

      console.log('Order created successfully:', newOrder.id);
      return newOrder.id;
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast.error(error.message || "Failed to create order. Please contact support.");
      return null;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (stripePaymentIntentId: string, paymentMethodId?: string) => {
    console.log('🎉 Payment successful:', { stripePaymentIntentId, paymentMethodId, orderId });
    
    if (!orderId) {
      console.error('❌ No order ID available for payment success');
      toast.error('Order ID missing. Please contact support.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      console.log('🔍 Verifying payment intent with order:', { 
        payment_intent_id: stripePaymentIntentId, 
        order_id: orderId 
      });

      // Use the new verify-payment-intent function instead of verify-checkout-session
      const { data, error } = await supabase.functions.invoke('verify-payment-intent', {
        body: { 
          payment_intent_id: stripePaymentIntentId,
          order_id: orderId
        }
      });

      console.log('📋 Payment verification response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Payment verification failed');
      }

      if (data?.success) {
        console.log('✅ Payment verified successfully, clearing cart and navigating...');
        
        // Clear the cart
        clearCart();
        
        // Show success message
        toast.success('Payment successful! Your order has been confirmed.');
        
        // Navigate to orders page
        navigate('/orders');
      } else {
        throw new Error(data?.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('❌ Payment verification error:', error);
      toast.error(error.message || 'There was an issue verifying your payment. Please contact support.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    toast.error(error);
  };

  const handlePlaceOrder = async () => {
    try {
      setIsProcessingPayment(true);
      setPaymentError(null);

      // 1. Create Order
      const newOrderId = await handleCreateOrder('');
      if (!newOrderId) {
        throw new Error("Failed to create order.");
      }

    } catch (error: any) {
      console.error("Error during checkout process:", error);
      setPaymentError(error.message || "An error occurred during checkout.");
      toast.error(error.message || "An error occurred during checkout.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="shipping">
              <AccordionTrigger>
                <span className="w-full flex justify-between items-center">
                  Shipping Information
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">Shipping form placeholder - implement shipping form component</p>
                  <Button onClick={handleShippingSubmit} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Continue to Gift Options'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gift">
              <AccordionTrigger>
                <span className="w-full flex justify-between items-center">
                  Gift Options
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <GiftOptionsForm
                  giftOptions={giftOptions}
                  onChange={setGiftOptions}
                />
                <Button onClick={handleGiftOptionsSubmit} disabled={isProcessing} className="mt-4">
                  {isProcessing ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment">
              <AccordionTrigger>
                <span className="w-full flex justify-between items-center">
                  Payment
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {clientSecret && (
                  <PaymentMethodSelector
                    clientSecret={clientSecret}
                    totalAmount={totalAmount}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    isProcessingPayment={isProcessingPayment}
                    onProcessingChange={setIsProcessingPayment}
                    refreshKey={refreshKey}
                    onRefreshKeyChange={setRefreshKey}
                    shippingAddress={checkoutData.shippingInfo}
                  />
                )}
                {paymentError && (
                  <div className="mt-4 text-red-500">{paymentError}</div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({getItemCount()} items)</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            disabled={!canPlaceOrder() || isProcessingPayment}
            className="w-full"
            size="lg"
            onClick={handlePlaceOrder}
          >
            {isProcessingPayment ? 'Processing...' : `Place Order`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedCheckoutForm;
