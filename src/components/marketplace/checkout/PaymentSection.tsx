
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from "@/integrations/stripe/client";
import StripePaymentForm from "./StripePaymentForm";
import ExpressCheckoutButton from "./ExpressCheckoutButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: (paymentIntentId?: string) => void;
  isProcessing: boolean;
  canPlaceOrder: boolean;
  onPrevious: () => void;
  totalAmount: number;
  cartItems: CartItem[];
  shippingInfo?: any;
  giftOptions?: any;
}

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isProcessing,
  canPlaceOrder,
  onPrevious,
  totalAmount,
  cartItems,
  shippingInfo,
  giftOptions
}: PaymentSectionProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'card' && totalAmount > 0 && !clientSecret && !isCreatingPaymentIntent) {
      createPaymentIntent();
    }
  }, [paymentMethod, totalAmount]);

  const createPaymentIntent = async () => {
    setIsCreatingPaymentIntent(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            order_type: 'marketplace'
          }
        }
      });

      if (error) {
        throw error;
      }

      setClientSecret(data.client_secret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    onPlaceOrder(paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="express" id="express" />
              <Label htmlFor="express" className="flex items-center gap-2 flex-1 cursor-pointer">
                <Smartphone className="h-4 w-4" />
                Express Checkout (Stripe)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 flex-1 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="demo" id="demo" />
              <Label htmlFor="demo" className="flex items-center gap-2 flex-1 cursor-pointer">
                Demo Mode (Testing)
              </Label>
            </div>
          </RadioGroup>

          {paymentMethod === 'express' && (
            <div className="mt-4">
              <ExpressCheckoutButton
                cartItems={cartItems}
                totalAmount={totalAmount}
                shippingInfo={shippingInfo}
                giftOptions={giftOptions}
                onProcessing={() => {}}
                onSuccess={() => {}}
              />
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="mt-4">
              {isCreatingPaymentIntent ? (
                <div className="text-center py-4">Creating payment form...</div>
              ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={totalAmount}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isProcessing={paymentProcessing}
                    onProcessingChange={setPaymentProcessing}
                  />
                </Elements>
              ) : (
                <div className="text-center py-4 text-red-600">
                  Failed to initialize payment form
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'demo' && (
            <div className="mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> This will create a test order without processing payment.
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                  Back to Schedule
                </Button>
                <Button 
                  onClick={() => onPlaceOrder()}
                  disabled={!canPlaceOrder || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Place Demo Order"}
                </Button>
              </div>
            </div>
          )}

          {paymentMethod !== 'demo' && paymentMethod !== 'express' && (
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={onPrevious}>
                Back to Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSection;
