
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CreditCard, Truck, Gift, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import CheckoutShippingForm from './CheckoutShippingForm';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import SavedPaymentMethodsSection from './SavedPaymentMethodsSection';
import ModernPaymentForm from '@/components/payments/ModernPaymentForm';
import { useCheckoutState } from '../marketplace/checkout/useCheckoutState';
import { createOrder } from '@/services/orderService';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_live_51PxcV7JPK0Zkd1vcAlsGEoYr82Lr7eGxIiYeOG0Gne4lAfwIWOcw3MMJCyL4jk41NDxx5HlYwO8xkhUm3svy8imt00IWkGpE0Z'
);

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface EnhancedCheckoutFormProps {
  onCheckoutComplete: (orderData: any) => void;
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({ onCheckoutComplete }) => {
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const {
    activeTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    getShippingCost
  } = useCheckoutState();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = getShippingCost();
  const taxAmount = subtotal * 0.08; // 8% tax
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Create payment intent when we reach the payment tab
  useEffect(() => {
    if (activeTab === 'payment' && !clientSecret && totalAmount > 0) {
      createPaymentIntent();
    }
  }, [activeTab, totalAmount, clientSecret]);

  const createPaymentIntent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            cart_items: JSON.stringify(cartItems.map(item => ({
              product_id: item.product.product_id,
              quantity: item.quantity,
              price: item.product.price
            })))
          }
        }
      });

      if (error) throw error;

      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedPaymentMethod(method);
    setShowNewCardForm(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedPaymentMethod(null);
    setShowNewCardForm(true);
  };

  const processOrderWithSavedCard = async () => {
    if (!selectedPaymentMethod || !paymentIntentId) return;

    setIsProcessing(true);
    try {
      // Confirm payment with saved payment method
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: selectedPaymentMethod.stripe_payment_method_id
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create order in database
      await createOrderRecord(paymentIntentId);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewCardPaymentSuccess = async (paymentIntentId: string, saveCard: boolean) => {
    try {
      await createOrderRecord(paymentIntentId);
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Payment successful but order creation failed. Please contact support.');
    }
  };

  const createOrderRecord = async (paymentIntentId: string) => {
    try {
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
        paymentIntentId
      };

      const order = await createOrder(orderData);
      
      // Clear cart and redirect to success
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order.id}`);
      onCheckoutComplete(order);
      
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const canProceedToPayment = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canPlaceOrder = () => {
    return selectedPaymentMethod || showNewCardForm;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cart')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
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
            </TabsList>

            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CheckoutShippingForm 
                    shippingInfo={checkoutData.shippingInfo}
                    onUpdateShippingInfo={handleUpdateShippingInfo}
                  />
                  <div className="mt-6">
                    <Button 
                      onClick={() => handleTabChange('payment')}
                      disabled={!canProceedToPayment()}
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user && (
                    <SavedPaymentMethodsSection
                      onSelectPaymentMethod={handleSelectPaymentMethod}
                      onAddNewMethod={handleAddNewMethod}
                      selectedMethodId={selectedPaymentMethod?.id}
                    />
                  )}

                  {selectedPaymentMethod && (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-accent/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5" />
                            <div>
                              <div className="font-medium">
                                {selectedPaymentMethod.card_type} ending in {selectedPaymentMethod.last_four}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Expires {selectedPaymentMethod.exp_month}/{selectedPaymentMethod.exp_year}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-lg font-semibold">
                          Total: ${totalAmount.toFixed(2)}
                        </div>
                        <Button 
                          onClick={processOrderWithSavedCard}
                          disabled={isProcessing}
                          className="min-w-[140px]"
                        >
                          {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
                        </Button>
                      </div>
                    </div>
                  )}

                  {showNewCardForm && clientSecret && (
                    <Elements stripe={stripePromise}>
                      <ModernPaymentForm
                        clientSecret={clientSecret}
                        amount={totalAmount}
                        onSuccess={handleNewCardPaymentSuccess}
                        allowSaveCard={!!user}
                        buttonText={`Pay $${totalAmount.toFixed(2)}`}
                      />
                    </Elements>
                  )}

                  {!user && !showNewCardForm && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Sign in to use saved payment methods or continue as guest
                      </p>
                      <Button 
                        onClick={handleAddNewMethod}
                        variant="outline"
                      >
                        Continue as Guest
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CheckoutOrderSummary 
              items={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
