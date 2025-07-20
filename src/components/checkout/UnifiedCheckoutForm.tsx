
import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Package, MapPin, Gift } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import CheckoutForm from '@/components/marketplace/checkout/CheckoutForm';
import CheckoutOrderSummary from '@/components/checkout/CheckoutOrderSummary';
import SavedPaymentMethodsSection from '@/components/checkout/SavedPaymentMethodsSection';
import StripePaymentForm from '@/components/marketplace/checkout/StripePaymentForm';
import { useCheckoutState, ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import { createOrder } from '@/services/orderService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [activeTab, setActiveTab] = useState('shipping');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<PaymentMethod | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    activeTab: checkoutActiveTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder: checkoutCanPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  // Calculate order totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = getShippingCost();
  const giftingFee = 0; // No gifting fee for now
  const taxAmount = subtotal * 0.08; // 8% tax
  const totalAmount = subtotal + shippingCost + giftingFee + taxAmount;

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

  // Create payment intent when we have all necessary info
  useEffect(() => {
    if (totalAmount > 0 && activeTab === 'payment') {
      createPaymentIntent();
    }
  }, [totalAmount, activeTab]);

  const createPaymentIntent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            order_type: 'marketplace_purchase',
            item_count: cartItems.length,
            user_id: user?.id || 'guest'
          }
        }
      });

      if (error) throw error;

      setClientSecret(data.client_secret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedSavedMethod(null);
    setShowNewCardForm(true);
  };

  const handleUseExistingCard = async () => {
    if (!selectedSavedMethod) return;

    try {
      setIsProcessingPayment(true);
      
      // Create a new payment intent with the existing payment method
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          metadata: {
            useExistingPaymentMethod: true,
            paymentMethodId: selectedSavedMethod.stripe_payment_method_id,
            order_type: 'marketplace_purchase'
          }
        }
      });

      if (error) throw error;

      // If payment is successful, call the success handler
      if (data.status === 'succeeded') {
        await handlePaymentSuccess(data.payment_intent_id, selectedSavedMethod.stripe_payment_method_id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      console.error('Error processing existing payment method:', error);
      toast.error(error.message || 'Failed to process payment with saved card');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessingPayment(true);

      // Save payment method if requested and not already saved
      if (saveNewCard && paymentMethodId && user) {
        try {
          await supabase.functions.invoke('save-payment-method', {
            body: {
              paymentMethodId,
              makeDefault: !selectedSavedMethod // Make default if no saved methods exist
            }
          });
          toast.success('Payment method saved for future use');
          setRefreshKey(prev => prev + 1); // Refresh saved methods
        } catch (error) {
          console.error('Failed to save payment method:', error);
          // Don't fail the order, just log the error
        }
      }

      // Create the order
      const orderData = {
        cartItems,
        subtotal,
        shippingCost: shippingCost,
        taxAmount,
        totalAmount,
        shippingInfo,
        giftOptions,
        paymentIntentId
      };

      const order = await createOrder(orderData);
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Order creation failed. Please contact support.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
    setIsProcessingPayment(false);
  };

  const canProceedToPayment = () => {
    return shippingInfo.name && shippingInfo.address && shippingInfo.city && 
           shippingInfo.state && shippingInfo.zipCode && shippingInfo.country;
  };

  const canPlaceOrder = () => {
    return canProceedToPayment() && 
           (selectedSavedMethod || showNewCardForm) && 
           clientSecret;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="payment" disabled={!canProceedToPayment()}>
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="review" disabled={!canPlaceOrder()}>
                <Package className="h-4 w-4 mr-2" />
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CheckoutForm
                    shippingInfo={shippingInfo}
                    onUpdate={(data) => handleUpdateShippingInfo(data)}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setActiveTab('payment')}
                  disabled={!canProceedToPayment()}
                  size="lg"
                >
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Elements stripe={stripePromise}>
                    {user ? (
                      <div className="space-y-6">
                        <SavedPaymentMethodsSection
                          onSelectPaymentMethod={handleSelectPaymentMethod}
                          onAddNewMethod={handleAddNewMethod}
                          selectedMethodId={selectedSavedMethod?.id}
                          refreshKey={refreshKey}
                        />

                        {selectedSavedMethod && (
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    {selectedSavedMethod.card_type} ending in {selectedSavedMethod.last_four}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Expires {selectedSavedMethod.exp_month.toString().padStart(2, '0')}/{selectedSavedMethod.exp_year}
                                  </p>
                                </div>
                                <Button 
                                  onClick={handleUseExistingCard}
                                  disabled={isProcessingPayment}
                                  size="lg"
                                >
                                  {isProcessingPayment ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {showNewCardForm && clientSecret && (
                          <div className="space-y-4">
                            <Separator />
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="save-card"
                                  checked={saveNewCard}
                                  onChange={(e) => setSaveNewCard(e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor="save-card" className="text-sm">
                                  Save this card for future purchases
                                </label>
                              </div>
                              <StripePaymentForm
                                clientSecret={clientSecret}
                                amount={totalAmount}
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                                isProcessing={isProcessingPayment}
                                onProcessingChange={setIsProcessingPayment}
                                savePaymentMethod={saveNewCard}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      clientSecret && (
                        <StripePaymentForm
                          clientSecret={clientSecret}
                          amount={totalAmount}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          isProcessing={isProcessingPayment}
                          onProcessingChange={setIsProcessingPayment}
                        />
                      )
                    )}
                  </Elements>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('shipping')}
                >
                  Back to Shipping
                </Button>
                <Button 
                  onClick={() => setActiveTab('review')}
                  disabled={!canPlaceOrder()}
                  size="lg"
                >
                  Review Order
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Shipping Address</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>{shippingInfo.name}</p>
                      <p>{shippingInfo.address}</p>
                      {shippingInfo.addressLine2 && <p>{shippingInfo.addressLine2}</p>}
                      <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                      <p>{shippingInfo.country}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Payment Method</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedSavedMethod ? (
                        <p>{selectedSavedMethod.card_type} ending in {selectedSavedMethod.last_four}</p>
                      ) : (
                        <p>New credit card</p>
                      )}
                    </div>
                  </div>

                  {giftOptions.isGift && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Gift Options
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {giftOptions.giftMessage && <p>Message: {giftOptions.giftMessage}</p>}
                          {giftOptions.scheduledDeliveryDate && (
                            <p>Delivery Date: {new Date(giftOptions.scheduledDeliveryDate).toLocaleDateString()}</p>
                          )}
                          {giftOptions.isSurpriseGift && <p>This is a surprise gift</p>}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('payment')}
                >
                  Back to Payment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CheckoutOrderSummary
              items={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              giftingFee={giftingFee}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
