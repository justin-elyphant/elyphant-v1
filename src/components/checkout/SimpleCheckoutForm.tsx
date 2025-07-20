import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createOrder, CreateOrderData } from '@/services/orderService';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';

const CARD_OPTIONS = {
  iconStyle: 'solid',
  style: {
    base: {
      iconColor: '#c4f0ff',
      color: 'black',
      fontWeight: 500,
      fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      ':-webkit-autofill': {
        color: '#fce883',
      },
      '::placeholder': {
        color: '#87bbfd',
      },
    },
    invalid: {
      iconColor: '#ffc7ee',
      color: '#ffc7ee',
    },
  },
};

const CheckoutFormContent = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(10);
  const [taxRate, setTaxRate] = useState(0.07);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    calculateTotals();
    loadUserProfile();
  }, [cartItems]);

  const calculateTotals = () => {
    const newSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    setSubtotal(newSubtotal);

    const newTaxAmount = newSubtotal * taxRate;
    setTaxAmount(newTaxAmount);

    const newTotal = newSubtotal + shippingCost + newTaxAmount;
    setTotal(newTotal);
  };

  const loadUserProfile = async () => {
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          name: profile.full_name || '',
          address: profile.address || '',
          line2: profile.address_line2 || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zip_code || '',
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      
      // Create order data
      const orderData: CreateOrderData = {
        cartItems,
        subtotal: subtotal,
        shippingCost: shippingCost,
        taxAmount: taxAmount,
        totalAmount: total,
        shippingInfo: {
          name: formData.name,
          email: user?.email || '',
          address: formData.address,
          addressLine2: formData.line2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'US'
        },
        giftOptions: {
          isGift: false,
          recipientName: '',
          giftMessage: '',
          giftWrapping: false,
          isSurpriseGift: false,
          scheduledDeliveryDate: undefined
        },
        paymentIntentId
      };

      console.log('Creating order with payment intent:', paymentIntentId);
      const order = await createOrder(orderData);
      console.log('Order created successfully:', order.id);

      // Update order status to reflect successful payment
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        toast.error('Payment successful but order status update failed');
      }

      // Trigger Zinc order processing
      try {
        console.log('Triggering Zinc order processing for order:', order.id);
        
        const { data: zincResponse, error: zincError } = await supabase.functions.invoke('process-zinc-order', {
          body: { 
            orderId: order.id,
            isTestMode: true // Set to false for production
          }
        });

        if (zincError) {
          console.error('Zinc processing error:', zincError);
          toast.error('Payment successful but order fulfillment may be delayed');
        } else if (zincResponse?.success) {
          console.log('Zinc order processing initiated:', zincResponse.zincOrderId);
          toast.success('Payment successful! Your order is being processed for fulfillment.');
        } else {
          console.error('Zinc processing failed:', zincResponse);
          toast.warning('Payment successful but order fulfillment may be delayed');
        }
      } catch (zincError) {
        console.error('Failed to trigger Zinc processing:', zincError);
        toast.warning('Payment successful but order fulfillment may be delayed');
      }

      // Clear cart and navigate to success page
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/checkout-success', { 
        state: { 
          orderId: order.id,
          orderNumber: order.order_number,
          total: total
        } 
      });

    } catch (error) {
      console.error('Error in payment success handler:', error);
      toast.error('There was an error processing your order. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setPaymentError(errorMessage);
    toast.error(errorMessage);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!stripe || !elements) {
      toast.error('Stripe is not initialized.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent via Supabase edge function
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(total * 100),
          currency: 'usd',
          metadata: {
            orderId: 'temp-order-id'
          }
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      const { clientSecret } = paymentData;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardName || formData.name,
            address: {
              line1: formData.address,
              line2: formData.line2,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
              country: 'US'
            }
          }
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        await handlePaymentSuccess(paymentIntent.id, paymentIntent.payment_method as string);
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      setPaymentError(error.message || 'Failed to process payment');
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-white shadow-md rounded-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cardName">Name on Card</Label>
              <Input
                type="text"
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="line2">Address Line 2 (Optional)</Label>
            <Input
              type="text"
              id="line2"
              name="line2"
              value={formData.line2}
              onChange={handleChange}
              placeholder="Apt 4B"
              className="mt-1"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="10001"
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Payment Information Section */}
          <div className="space-y-4">
            <div className="text-lg font-semibold">Payment Information</div>
            <div>
              <Label htmlFor="card-element">Credit or Debit Card</Label>
              <div className="mt-1 p-3 border border-input rounded-md bg-background">
                <CardElement
                  id="card-element"
                  options={CARD_OPTIONS as any}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-lg font-semibold">Order Summary</div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {paymentError && (
            <div className="text-red-500">{paymentError}</div>
          )}

          <Button
            onClick={handleFormSubmit}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const SimpleCheckoutForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent />
    </Elements>
  );
};

export default SimpleCheckoutForm;
