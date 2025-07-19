
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CheckoutTabs from './CheckoutTabs';
import ShippingForm from './ShippingForm';
import OrderSummary from './OrderSummary';
import PaymentSection from '@/components/payments/PaymentSection';
import { useCheckoutState } from './useCheckoutState';
import { createOrder } from '@/services/orderService';
import { toast } from 'sonner';

interface EnhancedCheckoutFormProps {
  onCheckoutComplete: (orderData: any) => void;
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({
  onCheckoutComplete
}) => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    activeTab,
    setActiveTab,
    shippingInfo,
    setShippingInfo,
    giftOptions,
    setGiftOptions,
    isProcessing,
    setIsProcessing
  } = useCheckoutState();

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = 9.99; // Standard shipping cost
  const getTaxAmount = () => cartTotal * 0.0825; // 8.25% tax
  const totalAmount = cartTotal + shippingCost + getTaxAmount();

  const canProceedToNext = (tab: string) => {
    switch (tab) {
      case 'shipping':
        return shippingInfo.firstName && shippingInfo.lastName && 
               shippingInfo.address && shippingInfo.city && 
               shippingInfo.state && shippingInfo.zipCode;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (activeTab === 'shipping' && canProceedToNext('shipping')) {
      setActiveTab('payment');
    }
  };

  const handleBackStep = () => {
    if (activeTab === 'payment') {
      setActiveTab('shipping');
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsProcessing(true);
      
      // Create the order in our database
      const orderData = {
        cartItems,
        subtotal: cartTotal,
        shippingCost,
        taxAmount: getTaxAmount(),
        totalAmount,
        shippingInfo,
        giftOptions,
        paymentIntentId
      };

      const order = await createOrder(orderData);
      
      // Process the order through Zinc for fulfillment
      try {
        const { data: zincResult, error: zincError } = await supabase.functions.invoke('process-zinc-order', {
          body: {
            orderRequest: {
              retailer: 'amazon',
              products: cartItems.map(item => ({
                product_id: item.product.product_id,
                quantity: item.quantity
              })),
              shipping_address: {
                first_name: shippingInfo.firstName,
                last_name: shippingInfo.lastName,
                address_line1: shippingInfo.address,
                address_line2: shippingInfo.address2 || '',
                zip_code: shippingInfo.zipCode,
                city: shippingInfo.city,
                state: shippingInfo.state,
                country: 'US'
              },
              billing_address: {
                first_name: shippingInfo.firstName,
                last_name: shippingInfo.lastName,
                address_line1: shippingInfo.address,
                address_line2: shippingInfo.address2 || '',
                zip_code: shippingInfo.zipCode,
                city: shippingInfo.city,
                state: shippingInfo.state,
                country: 'US'
              },
              payment_method: {
                use_gift: false
              },
              is_gift: giftOptions.isGift,
              gift_message: giftOptions.giftMessage,
              is_test: true
            },
            orderId: order.id,
            paymentIntentId
          }
        });

        if (zincError) {
          console.error('Zinc processing error:', zincError);
          toast.error('Order placed but fulfillment may be delayed');
        } else {
          toast.success('Order placed and sent for fulfillment!');
        }
      } catch (zincError) {
        console.error('Error processing Zinc order:', zincError);
        toast.error('Order placed but fulfillment may be delayed');
      }

      // Clear cart and redirect
      clearCart();
      toast.success('Payment successful! Your order has been placed.');
      navigate('/orders');
      
      onCheckoutComplete(order);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const availableTabs = ['shipping', 'payment'];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/marketplace')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shopping
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            availableTabs={availableTabs}
            canProceedToNext={canProceedToNext}
          >
            <TabsContent value="shipping">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                  <ShippingForm
                    shippingInfo={shippingInfo}
                    onShippingInfoChange={setShippingInfo}
                  />
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={handleNextStep}
                      disabled={!canProceedToNext('shipping')}
                    >
                      Continue to Payment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Payment</h2>
                    <Button 
                      variant="outline" 
                      onClick={handleBackStep}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  </div>
                  
                  <PaymentSection
                    amount={totalAmount}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={(error) => {
                      console.error('Payment error:', error);
                      toast.error('Payment failed. Please try again.');
                    }}
                    isProcessing={isProcessing}
                    onProcessingChange={setIsProcessing}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </CheckoutTabs>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            cartItems={cartItems}
            cartTotal={cartTotal}
            shippingCost={shippingCost}
            selectedShippingOption={null}
            giftOptions={giftOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
