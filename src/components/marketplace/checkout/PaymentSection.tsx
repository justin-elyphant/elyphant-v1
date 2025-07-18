
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from "@/integrations/stripe/client";
import ModernPaymentForm from "../../checkout/ModernPaymentForm";
import SavedPaymentMethodsSection from "../../checkout/SavedPaymentMethodsSection";
import ExpressCheckoutButton from "./ExpressCheckoutButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
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
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<any>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

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

  const handleSelectPaymentMethod = (method: any) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedSavedMethod(null);
    setShowNewCardForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <div className="flex items-center space-x-2 p-2 border rounded-lg">
              <RadioGroupItem value="express" id="express" />
              <Label htmlFor="express" className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
                <Smartphone className="h-4 w-4" />
                Express Checkout (Apple Pay, Google Pay)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-2 border rounded-lg">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-2 border rounded-lg">
              <RadioGroupItem value="demo" id="demo" />
              <Label htmlFor="demo" className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
                Demo Mode (Testing)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Express Checkout */}
      {paymentMethod === 'express' && (
        <ExpressCheckoutButton
          cartItems={cartItems}
          totalAmount={totalAmount}
          shippingInfo={shippingInfo}
          giftOptions={giftOptions}
          onProcessing={() => {}}
          onSuccess={() => {}}
        />
      )}

      {/* Card Payment */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          {user && (
            <SavedPaymentMethodsSection
              onSelectPaymentMethod={handleSelectPaymentMethod}
              onAddNewMethod={handleAddNewMethod}
              selectedMethodId={selectedSavedMethod?.id}
            />
          )}
          
          {(showNewCardForm || !user) && (
            <div>
              {isCreatingPaymentIntent ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm">Setting up secure payment form...</p>
                </div>
              ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <ModernPaymentForm
                    clientSecret={clientSecret}
                    amount={totalAmount}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isProcessing={paymentProcessing}
                    onProcessingChange={setPaymentProcessing}
                  />
                </Elements>
              ) : (
                <Card>
                  <CardContent className="text-center py-6">
                    <p className="text-destructive text-sm">Failed to initialize payment form</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setClientSecret('')}
                      className="mt-3 h-9"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Demo Mode */}
      {paymentMethod === 'demo' && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> This will create a test order without processing payment.
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onPrevious} className="h-9">
                Back to Schedule
              </Button>
              <Button 
                onClick={() => onPlaceOrder()}
                disabled={!canPlaceOrder || isProcessing}
                className="h-9"
              >
                {isProcessing ? "Processing..." : "Place Demo Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {paymentMethod !== 'demo' && paymentMethod !== 'express' && !showNewCardForm && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious} className="h-9">
            Back to Schedule
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
