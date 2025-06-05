
import React, { useState, useEffect } from "react";
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from "@/integrations/stripe/client";
import { Button } from "@/components/ui/button";
import { CreditCard, Info, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StripePaymentForm from "./StripePaymentForm";
import { CartItem } from "@/contexts/CartContext";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: (paymentIntentId?: string) => void;
  isProcessing: boolean;
  canPlaceOrder: boolean;
  onPrevious: () => void;
  totalAmount: number;
  cartItems?: CartItem[];
}

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isProcessing,
  canPlaceOrder,
  onPrevious,
  totalAmount,
  cartItems = []
}: PaymentSectionProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Initialize payment intent immediately when card payment is selected
  useEffect(() => {
    if (paymentMethod === "card" && totalAmount > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [paymentMethod, totalAmount]);

  const createPaymentIntent = async () => {
    if (isCreatingPayment || clientSecret) return;
    
    setIsCreatingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: totalAmount,
          currency: 'usd',
          metadata: {
            order_type: 'marketplace',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment intent');
      }

      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
      console.log("Payment intent created successfully");
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleExpressCheckout = async () => {
    if (!canPlaceOrder) {
      toast.error("Please complete all required fields before proceeding");
      return;
    }

    setIsCreatingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          amount: totalAmount,
          currency: 'usd',
          cartItems: cartItems,
          metadata: {
            order_type: 'marketplace',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to initialize Express Checkout. Please try again.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId);
    onPlaceOrder(paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
    setPaymentProcessing(false);
  };

  const handleDemoOrder = () => {
    onPlaceOrder();
  };

  const handleCardPaymentMethodSelect = () => {
    onPaymentMethodChange("card");
    if (!clientSecret && totalAmount > 0) {
      createPaymentIntent();
    }
  };

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Payment Method</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input 
            type="radio" 
            id="card-payment" 
            name="payment-method"
            checked={paymentMethod === "card"}
            onChange={handleCardPaymentMethodSelect}
            className="mr-2"
          />
          <label htmlFor="card-payment" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Credit/Debit Card
          </label>
        </div>

        <div className="flex items-center">
          <input 
            type="radio" 
            id="express-checkout" 
            name="payment-method"
            checked={paymentMethod === "express"}
            onChange={() => onPaymentMethodChange("express")}
            className="mr-2"
          />
          <label htmlFor="express-checkout" className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Express Checkout
          </label>
        </div>

        <div className="flex items-center">
          <input 
            type="radio" 
            id="demo-payment" 
            name="payment-method"
            checked={paymentMethod === "demo"}
            onChange={() => onPaymentMethodChange("demo")}
            className="mr-2"
          />
          <label htmlFor="demo-payment" className="flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Demo Mode (Skip Payment)
          </label>
        </div>

        {paymentMethod === "card" && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            {isCreatingPayment && (
              <div className="text-center text-sm text-gray-600 mb-4">
                Initializing payment...
              </div>
            )}
            {clientSecret && (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  amount={totalAmount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={paymentProcessing}
                  onProcessingChange={setPaymentProcessing}
                />
              </Elements>
            )}
            {!clientSecret && !isCreatingPayment && (
              <div className="text-center">
                <Button 
                  onClick={createPaymentIntent}
                  disabled={!canPlaceOrder}
                  variant="outline"
                >
                  Initialize Payment
                </Button>
              </div>
            )}
          </div>
        )}

        {paymentMethod === "express" && (
          <div className="pl-6 text-sm text-muted-foreground flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Fast and secure checkout powered by Stripe. Mobile-optimized experience.
          </div>
        )}

        {paymentMethod === "demo" && (
          <div className="pl-6 text-sm text-muted-foreground flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Demo mode will simulate a successful payment without charging
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onPrevious}>
          Back to Schedule
        </Button>

        {paymentMethod === "demo" && (
          <Button 
            onClick={handleDemoOrder}
            disabled={isProcessing || !canPlaceOrder}
          >
            {isProcessing ? "Processing..." : "Place Demo Order"}
          </Button>
        )}

        {paymentMethod === "express" && (
          <Button 
            onClick={handleExpressCheckout}
            disabled={isCreatingPayment || !canPlaceOrder}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingPayment ? "Redirecting..." : "Express Checkout"}
          </Button>
        )}

        {paymentMethod === "card" && clientSecret && !paymentProcessing && (
          <div className="text-sm text-gray-600">
            Complete payment form above to proceed
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSection;
