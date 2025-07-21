
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Truck, Gift } from 'lucide-react';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import UnifiedShippingForm from './UnifiedShippingForm';
import RecipientAssignmentSection from '@/components/marketplace/checkout/RecipientAssignmentSection';
import PaymentMethodSelector from './PaymentMethodSelector';
import { createOrder } from '@/services/orderService';

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    getShippingCost,
    saveCurrentAddressToProfile
  } = useCheckoutState();

  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recipientAssignments, setRecipientAssignments] = useState<Record<string, any>>({});
  const [deliveryGroups, setDeliveryGroups] = useState<any[]>([]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = getShippingCost();
  const taxAmount = subtotal * 0.08; // 8% tax
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Create payment intent when moving to payment tab
  useEffect(() => {
    if (activeTab === 'payment' && !clientSecret && !isCreatingPaymentIntent) {
      createPaymentIntent();
    }
  }, [activeTab, clientSecret, isCreatingPaymentIntent]);

  const createPaymentIntent = async () => {
    if (isCreatingPaymentIntent) return;
    
    setIsCreatingPaymentIntent(true);
    console.log('Creating payment intent for amount:', totalAmount);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            order_type: 'marketplace_purchase',
            item_count: cartItems.length.toString(),
            shipping_cost: (shippingCost * 100).toString()
          }
        }
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.payment_intent_id);
        console.log('Payment intent created successfully');
      } else {
        throw new Error('No client secret returned from payment intent creation');
      }
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    console.log('Payment successful:', { paymentIntentId, paymentMethodId });
    setIsProcessing(true);

    try {
      // Save address to profile
      await saveCurrentAddressToProfile('Checkout Address', false);

      // Create order in database
      const orderData = {
        cartItems,
        subtotal,
        shippingCost,
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
        deliveryGroups
      };

      console.log('Creating order with data:', orderData);
      const order = await createOrder(orderData);
      console.log('Order created successfully:', order.id);

      // Verify payment with backend
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-payment-intent', {
        body: {
          payment_intent_id: paymentIntentId,
          order_id: order.id
        }
      });

      if (verificationError) {
        console.error('Payment verification error:', verificationError);
        throw new Error(verificationError.message || 'Payment verification failed');
      }

      console.log('Payment verified successfully:', verificationData);
      
      // Clear cart and navigate to success page
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order.id}`);

    } catch (error: any) {
      console.error('Error processing successful payment:', error);
      toast.error('Payment succeeded but order processing failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
    setIsProcessing(false);
  };

  const handleNextStep = () => {
    if (activeTab === 'shipping') {
      // Validate shipping info
      const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
      if (!name || !email || !address || !city || !state || !zipCode) {
        toast.error('Please fill in all required shipping information');
        return;
      }
      handleTabChange('payment');
    }
  };

  const isShippingValid = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping
                {isShippingValid() && <Badge variant="secondary" className="ml-2">✓</Badge>}
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2" disabled={!isShippingValid()}>
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UnifiedShippingForm
                    shippingInfo={checkoutData.shippingInfo}
                    onUpdate={handleUpdateShippingInfo}
                    selectedShippingMethod={checkoutData.shippingMethod}
                    onShippingMethodChange={(method) => {
                      // Handle shipping method change if needed
                    }}
                    shippingOptions={[
                      { id: 'standard', name: 'Standard Shipping', price: shippingCost, estimatedDays: '5-7 business days' }
                    ]}
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
                <Button onClick={handleNextStep} disabled={!isShippingValid()}>
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <PaymentMethodSelector
                      clientSecret={clientSecret}
                      totalAmount={totalAmount}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      isProcessingPayment={isProcessing}
                      onProcessingChange={setIsProcessing}
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
                      {isCreatingPaymentIntent ? (
                        <div>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Setting up payment...</p>
                        </div>
                      ) : (
                        <Button onClick={createPaymentIntent} variant="outline">
                          Initialize Payment
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.product.product_id}-${item.quantity}`} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name || item.product.title}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
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
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Status */}
              {activeTab === 'payment' && (
                <div className="pt-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Payment Status: {clientSecret ? 'Ready' : 'Initializing...'}
                  </div>
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Processing payment...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
