
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CheckoutTabs from '@/components/marketplace/checkout/CheckoutTabs';
import CheckoutForm from '@/components/marketplace/checkout/CheckoutForm';
import OrderSummary from '@/components/marketplace/checkout/OrderSummary';
import PaymentSection from '@/components/marketplace/checkout/PaymentSection';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
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
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = 9.99; // Standard shipping cost
  const getTaxAmount = () => cartTotal * 0.0825; // 8.25% tax
  const totalAmount = cartTotal + shippingCost + getTaxAmount();

  const canProceedToNext = (tab: string): boolean => {
    switch (tab) {
      case 'shipping':
        const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
        return !!(name && email && address && city && state && zipCode);
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (activeTab === 'shipping' && canProceedToNext('shipping')) {
      handleTabChange('payment');
    }
  };

  const handleBackStep = () => {
    if (activeTab === 'payment') {
      handleTabChange('shipping');
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
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: { isGift: false, recipientName: '', giftMessage: '', giftWrapping: false, isSurpriseGift: false },
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
                first_name: checkoutData.shippingInfo.name?.split(' ')[0] || '',
                last_name: checkoutData.shippingInfo.name?.split(' ')[1] || '',
                address_line1: checkoutData.shippingInfo.address,
                address_line2: checkoutData.shippingInfo.addressLine2 || '',
                zip_code: checkoutData.shippingInfo.zipCode,
                city: checkoutData.shippingInfo.city,
                state: checkoutData.shippingInfo.state,
                country: 'US'
              },
              billing_address: {
                first_name: checkoutData.shippingInfo.name?.split(' ')[0] || '',
                last_name: checkoutData.shippingInfo.name?.split(' ')[1] || '',
                address_line1: checkoutData.shippingInfo.address,
                address_line2: checkoutData.shippingInfo.addressLine2 || '',
                zip_code: checkoutData.shippingInfo.zipCode,
                city: checkoutData.shippingInfo.city,
                state: checkoutData.shippingInfo.state,
                country: 'US'
              },
              payment_method: {
                use_gift: false
              },
              is_gift: false,
              gift_message: '',
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
            onTabChange={handleTabChange}
            availableTabs={availableTabs}
            canProceedToNext={canProceedToNext}
          >
            <TabsContent value="shipping">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                  <CheckoutForm
                    shippingInfo={checkoutData.shippingInfo}
                    onUpdate={handleUpdateShippingInfo}
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
                    paymentMethod={checkoutData.paymentMethod}
                    onPaymentMethodChange={() => {}}
                    onPlaceOrder={handlePaymentSuccess}
                    isProcessing={isProcessing}
                    canPlaceOrder={canPlaceOrder() !== ''}
                    onPrevious={handleBackStep}
                    totalAmount={totalAmount}
                    cartItems={cartItems}
                    shippingInfo={checkoutData.shippingInfo}
                    giftOptions={{ isGift: false, recipientName: '', giftMessage: '', giftWrapping: false, isSurpriseGift: false }}
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
            giftOptions={{ isGift: false, recipientName: '', giftMessage: '', giftWrapping: false, isSurpriseGift: false }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
