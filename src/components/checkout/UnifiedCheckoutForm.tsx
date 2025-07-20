
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import UnifiedShippingForm from './UnifiedShippingForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import RecipientAssignmentSection from './RecipientAssignmentSection';
import OrderSummary from './OrderSummary';

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Payment intent state
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);

  const {
    activeTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    canPlaceOrder,
    getShippingCost,
    saveCurrentAddressToProfile
  } = useCheckoutState();

  // Create payment intent when switching to payment tab
  React.useEffect(() => {
    if (activeTab === 'payment' && !clientSecret && !isCreatingPaymentIntent) {
      createPaymentIntent();
    }
  }, [activeTab, clientSecret, isCreatingPaymentIntent]);

  const createPaymentIntent = async () => {
    if (isCreatingPaymentIntent) return;
    
    setIsCreatingPaymentIntent(true);
    
    try {
      const totalAmount = getTotalAmount() * 100; // Convert to cents
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: totalAmount,
          currency: 'usd',
          metadata: {
            order_type: 'marketplace_purchase',
            user_id: user?.id || 'guest',
            cart_items: JSON.stringify(cartItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            })))
          }
        }
      });

      if (error) throw error;

      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const getTotalAmount = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = getShippingCost();
    const tax = subtotal * 0.0875; // 8.75% tax
    return subtotal + shipping + tax;
  };

  const handlePaymentSuccess = async (stripePaymentIntentId: string, paymentMethodId?: string) => {
    try {
      console.log('Payment successful, creating order...', { stripePaymentIntentId, paymentMethodId });
      
      // Create order in database
      const orderData = {
        user_id: user?.id || null,
        total_amount: getTotalAmount(),
        subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shipping_cost: getShippingCost(),
        tax_amount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.0875,
        currency: 'usd',
        status: 'pending',
        payment_status: 'completed',
        stripe_payment_intent_id: stripePaymentIntentId,
        shipping_info: {
          name: checkoutData.shippingInfo.name,
          email: checkoutData.shippingInfo.email,
          address: checkoutData.shippingInfo.address,
          line2: checkoutData.shippingInfo.addressLine2,
          city: checkoutData.shippingInfo.city,
          state: checkoutData.shippingInfo.state,
          zipCode: checkoutData.shippingInfo.zipCode,
          country: checkoutData.shippingInfo.country
        },
        shipping_method: checkoutData.shippingMethod
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.name,
        product_image: item.image
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Call verify-checkout-session to trigger Zinc processing
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-checkout-session', {
        body: {
          payment_intent_id: stripePaymentIntentId,
          order_id: order.id
        }
      });

      if (verificationError) {
        console.error('Verification error:', verificationError);
        // Don't fail the entire process if verification fails
      }

      console.log('Order created successfully:', order);
      
      // Clear cart and navigate to success page
      clearCart();
      navigate(`/payment-success?order=${order.order_number}`);
      
    } catch (error: any) {
      console.error('Error in payment success handler:', error);
      toast.error('Order creation failed. Please contact support.');
      throw error; // Re-throw to handle in payment component
    }
  };

  const canProceedToPayment = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="payment" disabled={!canProceedToPayment()}>
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

              <RecipientAssignmentSection cartItems={cartItems} />

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleTabChange('payment')}
                  disabled={!canProceedToPayment()}
                >
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  {isCreatingPaymentIntent ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Initializing payment...</p>
                    </div>
                  ) : (
                    <PaymentMethodSelector
                      clientSecret={clientSecret}
                      totalAmount={getTotalAmount()}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={(error) => toast.error(error)}
                      isProcessingPayment={isProcessing}
                      onProcessingChange={setIsProcessing}
                      refreshKey={refreshKey}
                      onRefreshKeyChange={setRefreshKey}
                      shippingAddress={checkoutData.shippingInfo}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary
            cartItems={cartItems}
            subtotal={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
            shipping={getShippingCost()}
            tax={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.0875}
            total={getTotalAmount()}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
