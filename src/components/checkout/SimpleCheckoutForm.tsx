
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import CheckoutShippingForm from './CheckoutShippingForm';
import SavedPaymentMethodsSection from './SavedPaymentMethodsSection';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import StripePaymentForm from '../marketplace/checkout/StripePaymentForm';

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const SimpleCheckoutForm: React.FC = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  // Pre-fill shipping info from user profile
  useEffect(() => {
    if (user) {
      // This will be handled by the CheckoutShippingForm component
      setShippingInfo(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [user]);

  const shippingCost = 6.99;
  const taxAmount = cartTotal * 0.0825; // 8.25% tax
  const totalAmount = cartTotal + shippingCost + taxAmount;

  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedPaymentMethod(method);
    setUseNewCard(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedPaymentMethod(null);
    setUseNewCard(true);
  };

  const createOrder = async () => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total_amount: Math.round(totalAmount * 100),
          shipping_info: shippingInfo,
          payment_status: 'pending',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.product_id || item.product.id?.toString(),
        product_name: item.product.name || item.product.title,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_image: item.product.image
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const createPaymentIntent = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          metadata: {
            orderId,
            userId: user?.id,
            customerEmail: user?.email,
            useExistingPaymentMethod: !!selectedPaymentMethod,
            paymentMethodId: selectedPaymentMethod?.stripe_payment_method_id
          }
        }
      });

      if (error) throw error;
      return data.client_secret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      toast.error('Please fill in all shipping information');
      return;
    }

    if (!selectedPaymentMethod && !useNewCard) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const order = await createOrder();
      
      // Create payment intent
      const secret = await createPaymentIntent(order.id);
      setClientSecret(secret);

      toast.success('Order created! Please complete payment.');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to create order');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'processing',
          stripe_payment_intent_id: paymentIntentId
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) throw error;

      // Clear cart
      clearCart();

      // Navigate to success page
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Payment succeeded but order update failed');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
    setIsProcessing(false);
  };

  if (clientSecret) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setClientSecret(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order Review
          </Button>
          <h2 className="text-2xl font-bold">Complete Payment</h2>
        </div>

        <Elements stripe={stripePromise}>
          <StripePaymentForm
            clientSecret={clientSecret}
            amount={totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            isProcessing={isProcessing}
            onProcessingChange={setIsProcessing}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <span className="font-medium">Shipping</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <span className="font-medium">Payment</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <span className="text-muted-foreground">Confirmation</span>
          </div>
        </div>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutShippingForm
              shippingInfo={shippingInfo}
              onUpdateShippingInfo={(data) => setShippingInfo(prev => ({ ...prev, ...data }))}
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user && (
              <SavedPaymentMethodsSection
                onSelectPaymentMethod={handleSelectPaymentMethod}
                onAddNewMethod={handleAddNewMethod}
                selectedMethodId={selectedPaymentMethod?.id}
              />
            )}
            
            {!user && (
              <div className="text-center py-4 text-muted-foreground">
                Please sign in to use saved payment methods
              </div>
            )}
          </CardContent>
        </Card>

        {/* Place Order Button */}
        <div className="pt-4">
          <Button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Place Order - $${totalAmount.toFixed(2)}`}
          </Button>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <CheckoutOrderSummary
          items={cartItems}
          subtotal={cartTotal}
          shippingCost={shippingCost}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
        />
      </div>
    </div>
  );
};

export default SimpleCheckoutForm;
