
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { createOrder } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, User, MapPin, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import ShippingForm from '@/components/marketplace/checkout/ShippingForm';
import GiftOptionsForm from '@/components/marketplace/checkout/GiftOptionsForm';
import OrderSummary from '@/components/marketplace/checkout/OrderSummary';
import StripePaymentForm from '@/components/marketplace/checkout/StripePaymentForm';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51QRGzTFQzKSe5Zq8pQYEOLJXzq3hWdoLMEH8H4KdoQyj4k0xTCX8nHK6hRHNj8tHEyYxJkZVTwF6Y0iHGQk2VkG200XtLLQEMq');

interface EnhancedCheckoutFormProps {
  onCheckoutComplete?: (orderData: any) => void;
}

const EnhancedCheckoutForm = ({ onCheckoutComplete }: EnhancedCheckoutFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');

  const {
    shippingInfo,
    setShippingInfo,
    giftOptions,
    setGiftOptions,
    subtotal,
    shippingCost,
    taxAmount,
    totalAmount
  } = useCheckoutState();

  const createOrderRecord = async () => {
    if (!user) {
      toast.error('Please log in to complete your order');
      return null;
    }

    try {
      setIsProcessing(true);
      console.log('Creating order record...');

      const orderData = {
        cartItems,
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        shippingInfo,
        giftOptions
      };

      const order = await createOrder(orderData);
      console.log('Order created:', order.id);
      setOrderId(order.id);

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const createPaymentIntent = async (order: any) => {
    try {
      console.log('Creating payment intent for order:', order.id);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          orderId: order.id,
          customerEmail: user?.email
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Payment intent created:', data.clientSecret);
      setClientSecret(data.clientSecret);
      setCurrentStep(3); // Move to payment step
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to create payment intent');
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log('Payment successful, processing order:', orderId);
      toast.loading('Processing your order...', { id: 'processing-order' });

      // Update order with payment information
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          stripe_payment_intent_id: paymentIntentId,
          payment_status: 'succeeded',
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw new Error('Failed to update order status');
      }

      // Trigger Zinc order processing
      console.log('Triggering Zinc order processing...');
      const { data: zincData, error: zincError } = await supabase.functions.invoke('process-zinc-order', {
        body: {
          orderId: orderId,
          isTestMode: true // Set to false for production
        }
      });

      if (zincError) {
        console.error('Zinc processing error:', zincError);
        // Don't fail the order completely - payment succeeded
        toast.warning('Payment successful but order processing delayed. We\'ll update you shortly.', { 
          id: 'processing-order',
          duration: 8000
        });
      } else if (zincData?.success) {
        console.log('Zinc order processed successfully:', zincData.zincOrderId);
        toast.success('Order placed successfully!', { id: 'processing-order' });
      } else {
        console.warn('Zinc processing returned unexpected result:', zincData);
        toast.warning('Payment successful. Order processing in progress.', { 
          id: 'processing-order',
          duration: 6000
        });
      }

      // Clear cart and navigate to confirmation
      clearCart();
      navigate(`/order-confirmation/${orderId}`);
      
      if (onCheckoutComplete) {
        onCheckoutComplete({ orderId, paymentIntentId });
      }

    } catch (error) {
      console.error('Error processing payment success:', error);
      toast.error('Payment succeeded but there was an issue processing your order. Please contact support.', {
        id: 'processing-order',
        duration: 10000
      });
      
      // Still navigate to confirmation since payment succeeded
      navigate(`/order-confirmation/${orderId}`);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(`Payment failed: ${error}`);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
        toast.error('Please fill in all shipping information');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const order = await createOrderRecord();
      if (order) {
        await createPaymentIntent(order);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Shipping Information</h2>
            </div>
            <ShippingForm 
              shippingInfo={shippingInfo} 
              onChange={setShippingInfo} 
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Gift Options</h2>
            </div>
            <GiftOptionsForm 
              giftOptions={giftOptions} 
              onChange={setGiftOptions} 
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Payment</h2>
            </div>
            {clientSecret && (
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
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            {renderStep()}
            
            <div className="flex justify-between mt-6">
              {currentStep > 1 && currentStep < 3 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {currentStep < 3 && (
                <Button 
                  onClick={handleNext} 
                  disabled={isProcessing}
                  className="ml-auto"
                >
                  {isProcessing ? 'Processing...' : 'Next'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <OrderSummary 
          items={cartItems}
          subtotal={subtotal}
          shippingCost={shippingCost}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
        />
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
