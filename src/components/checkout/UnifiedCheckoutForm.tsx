
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, CreditCard, FileText, CheckCircle } from 'lucide-react';
import CheckoutForm from '../marketplace/checkout/CheckoutForm';
import PaymentForm from '../marketplace/checkout/PaymentForm';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import PaymentMethodSelector from './PaymentMethodSelector';
import { createOrder, CreateOrderData } from '@/services/orderService';
import { usePricingSettings } from '@/hooks/usePricingSettings';

interface CheckoutData {
  shippingInfo: {
    name: string;
    email: string;
    address: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { calculatePriceBreakdown } = usePricingSettings();
  
  const [activeTab, setActiveTab] = useState('shipping');
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    shippingInfo: {
      name: '',
      email: user?.email || '',
      address: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    paymentMethod: 'card'
  });
  
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate pricing with dynamic gifting fee
  const shippingCost = 5.99; // This could be dynamic based on shipping method
  const priceBreakdown = calculatePriceBreakdown(cartTotal, shippingCost);
  const taxAmount = cartTotal * 0.08; // 8% tax
  const totalAmount = priceBreakdown.total + taxAmount;

  // Extract data from checkoutData with fallbacks
  const shippingInfo = checkoutData.shippingInfo;
  const giftOptions = {
    isGift: false,
    recipientName: '',
    giftMessage: '',
    giftWrapping: false,
    isSurpriseGift: false,
    scheduledDeliveryDate: undefined
  }; // Default gift options since gift functionality is not implemented yet

  // Create payment intent when we reach the review tab
  useEffect(() => {
    if (activeTab === 'review' && !clientSecret && totalAmount > 0) {
      createPaymentIntent();
    }
  }, [activeTab, totalAmount, clientSecret]);

  const createPaymentIntent = async () => {
    try {
      console.log('Creating payment intent for amount:', totalAmount);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            user_id: user?.id
          }
        }
      });

      if (error) throw error;
      
      console.log('Payment intent created:', data);
      setClientSecret(data.client_secret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const handleShippingUpdate = (shippingData: any) => {
    setCheckoutData(prev => ({
      ...prev,
      shippingInfo: { ...prev.shippingInfo, ...shippingData }
    }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setCheckoutData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      console.log('Payment successful, creating order...');
      
      const orderData: CreateOrderData = {
        cartItems,
        subtotal: cartTotal,
        shippingCost,
        taxAmount,
        totalAmount,
        shippingInfo,
        giftOptions,
        paymentIntentId
      };

      const order = await createOrder(orderData);
      console.log('Order created successfully:', order.id);
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Payment successful but failed to create order. Please contact support.');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
  };

  const canProceedToPayment = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canProceedToReview = () => {
    return canProceedToPayment() && checkoutData.paymentMethod;
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out
          </p>
          <Button onClick={() => navigate("/marketplace")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                disabled={!canProceedToPayment()}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                disabled={!canProceedToReview()}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <CheckoutForm
                    shippingInfo={checkoutData.shippingInfo}
                    onUpdate={handleShippingUpdate}
                  />
                  <div className="mt-6">
                    <Button 
                      onClick={() => setActiveTab('payment')}
                      disabled={!canProceedToPayment()}
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentForm
                    paymentMethod={checkoutData.paymentMethod}
                    onMethodChange={handlePaymentMethodChange}
                  />
                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('shipping')}
                    >
                      Back to Shipping
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('review')}
                      disabled={!checkoutData.paymentMethod}
                    >
                      Continue to Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Place Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <Elements stripe={stripePromise}>
                      <PaymentMethodSelector
                        clientSecret={clientSecret}
                        totalAmount={totalAmount}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        isProcessingPayment={isProcessingPayment}
                        onProcessingChange={setIsProcessingPayment}
                        refreshKey={refreshKey}
                        onRefreshKeyChange={setRefreshKey}
                      />
                    </Elements>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Preparing your order...</p>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('payment')}
                      disabled={isProcessingPayment}
                    >
                      Back to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

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
