import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { createOrder } from '@/services/orderService';
import { supabase } from '@/integrations/supabase/client';
import UnifiedShippingForm from './UnifiedShippingForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import CheckoutSummary from './CheckoutSummary';
import RecipientAssignmentSection from '@/components/marketplace/checkout/RecipientAssignmentSection';

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const {
    activeTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  const [recipientAssignments, setRecipientAssignments] = useState<Record<string, any>>({});
  const [deliveryGroups, setDeliveryGroups] = useState<any[]>([]);

  const handlePaymentSuccess = async (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    setIsProcessing(true);

    try {
      // Create order record with all checkout data
      const orderData = {
        cartItems: cartItems.map(item => ({
          ...item,
          recipientAssignment: recipientAssignments[item.product.product_id]
        })),
        subtotal: getSubtotal(),
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        totalAmount: getTotalAmount(),
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: {
          isGift: false,
          recipientName: '',
          giftMessage: '',
          giftWrapping: false,
          isSurpriseGift: false
        },
        paymentIntentId: paymentIntent.id,
        deliveryGroups: deliveryGroups.length > 0 ? deliveryGroups : undefined
      };

      console.log('Creating order with data:', orderData);
      const order = await createOrder(orderData);
      console.log('Order created successfully:', order.id);

      // Update order with Stripe session info and trigger Zinc processing
      const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
        body: { 
          session_id: paymentIntent.id,
          order_id: order.id
        }
      });

      if (error) {
        console.error('Payment verification error:', error);
        toast.error('Payment successful but order processing failed. Please contact support.');
        return;
      }

      if (data?.success) {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/payment-success?order=${order.order_number}`);
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }

    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getTaxAmount = () => {
    return getSubtotal() * 0.08; // 8% tax rate
  };

  const getTotalAmount = () => {
    return getSubtotal() + getShippingCost() + getTaxAmount();
  };

  const handleNext = () => {
    if (activeTab === "shipping") {
      handleTabChange("payment");
    }
  };

  const handleBack = () => {
    if (activeTab === "payment") {
      handleTabChange("shipping");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Checkout</h1>
        <p className="text-muted-foreground text-center">
          Complete your order securely
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                   <UnifiedShippingForm
                     shippingInfo={checkoutData.shippingInfo}
                     onUpdate={handleUpdateShippingInfo}
                     selectedShippingMethod={'standard'}
                     onShippingMethodChange={(method) => {}}
                     shippingOptions={[]}
                     isLoadingShipping={false}
                   />
                </CardContent>
              </Card>

              <RecipientAssignmentSection
                cartItems={cartItems}
                recipientAssignments={recipientAssignments}
                setRecipientAssignments={setRecipientAssignments}
                deliveryGroups={deliveryGroups}
                setDeliveryGroups={setDeliveryGroups}
              />

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg">
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardContent className="p-6">
                   <PaymentMethodSelector
                     clientSecret=""
                     totalAmount={getTotalAmount()}
                     onPaymentSuccess={handlePaymentSuccess}
                     onPaymentError={(error) => toast.error(error)}
                     isProcessingPayment={isProcessing}
                     onProcessingChange={setIsProcessing}
                     refreshKey={0}
                     onRefreshKeyChange={() => {}}
                     shippingAddress={checkoutData.shippingInfo}
                   />
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  Back to Shipping
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <CheckoutSummary
            cartItems={cartItems}
            subtotal={getSubtotal()}
            shippingCost={getShippingCost()}
            taxAmount={getTaxAmount()}
            totalAmount={getTotalAmount()}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
