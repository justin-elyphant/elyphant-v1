
import React, { useState, useEffect } from "react";
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from "@/integrations/stripe/client";
import { Button } from "@/components/ui/button";
import { CreditCard, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StripePaymentForm from "./StripePaymentForm";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: (paymentIntentId?: string) => void;
  isProcessing: boolean;
  canPlaceOrder: boolean;
  onPrevious: () => void;
  totalAmount: number;
}

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isProcessing,
  canPlaceOrder,
  onPrevious,
  totalAmount
}: PaymentSectionProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Create payment intent when component mounts and payment method is card
  useEffect(() => {
    if (paymentMethod === "card" && canPlaceOrder && totalAmount > 0) {
      createPaymentIntent();
    }
  }, [paymentMethod, canPlaceOrder, totalAmount]);

  const createPaymentIntent = async () => {
    if (isCreatingPayment) return;
    
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
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
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
  };

  const handleDemoOrder = () => {
    onPlaceOrder();
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
            onChange={() => onPaymentMethodChange("card")}
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

        {paymentMethod === "card" && clientSecret && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
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
          </div>
        )}

        {paymentMethod === "demo" && (
          <div className="pl-6 text-sm text-muted-foreground flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Demo mode will simulate a successful payment without charging
          </div>
        )}

        {paymentMethod === "card" && !clientSecret && canPlaceOrder && (
          <div className="pl-6 text-sm text-muted-foreground">
            {isCreatingPayment ? "Initializing payment..." : "Click 'Initialize Payment' to continue"}
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

        {paymentMethod === "card" && !clientSecret && (
          <Button 
            onClick={createPaymentIntent}
            disabled={isCreatingPayment || !canPlaceOrder}
          >
            {isCreatingPayment ? "Initializing..." : "Initialize Payment"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentSection;
