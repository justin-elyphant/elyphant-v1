import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

interface ModernPaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
}

const ModernPaymentForm = ({
  clientSecret,
  amount,
  onSuccess,
  onError,
  isProcessing,
  onProcessingChange
}: ModernPaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [cardBrand, setCardBrand] = useState<string>('');

  const handleCardChange = (event: any) => {
    setError(event.error ? event.error.message : null);
    setCardBrand(event.brand || '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting || isProcessing) {
      return;
    }

    setIsSubmitting(true);
    onProcessingChange(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Payment form not loaded properly');
      onProcessingChange(false);
      setIsSubmitting(false);
      return;
    }

    try {
      const paymentMethodData: any = {
        card: cardElement,
        billing_details: {
          email: user?.email,
        },
      };

      // Process the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethodData,
        }
      );

      // If user wants to save payment method and payment succeeded
      if (savePaymentMethod && user && paymentIntent?.payment_method) {
        try {
          const paymentMethod = paymentIntent.payment_method as any;
          const { error: dbError } = await supabase
            .from('payment_methods')
            .insert({
              user_id: user.id,
              stripe_payment_method_id: paymentMethod.id,
              card_type: paymentMethod.card?.brand || 'unknown',
              last_four: paymentMethod.card?.last4 || '0000',
              exp_month: paymentMethod.card?.exp_month || 1,
              exp_year: paymentMethod.card?.exp_year || 2030,
            });

          if (dbError) {
            console.error('Error saving payment method:', dbError);
          } else {
            toast.success('Payment method saved for future use');
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      if (confirmError) {
        if (confirmError.type === 'card_error') {
          throw new Error(confirmError.message || 'Your card was declined');
        } else {
          throw new Error(confirmError.message || 'Payment failed');
        }
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      onProcessingChange(false);
      setIsSubmitting(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '18px',
        color: 'hsl(var(--foreground))',
        fontFamily: 'system-ui, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
        padding: '16px',
        backgroundColor: 'transparent',
      },
      invalid: {
        color: 'hsl(var(--destructive))',
        iconColor: 'hsl(var(--destructive))',
      },
      complete: {
        color: 'hsl(var(--foreground))',
        iconColor: 'hsl(var(--primary))',
      },
    },
    hidePostalCode: false,
  };

  const getCardIcon = (brand: string) => {
    switch (brand) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {typeof getCardIcon(cardBrand) === 'string' ? (
              <span className="text-xl">{getCardIcon(cardBrand)}</span>
            ) : (
              getCardIcon(cardBrand)
            )}
            Payment Details
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Secure
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Input Section */}
          <div className="space-y-4">
            <div className="border-2 border-border rounded-lg p-6 bg-card transition-all duration-200 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <label className="block text-sm font-medium text-foreground mb-3">
                Card Information
              </label>
              <CardElement 
                options={cardElementOptions} 
                onChange={handleCardChange}
                className="min-h-[50px]"
              />
            </div>

            {/* Save Payment Method Option */}
            {user && (
              <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
                <Checkbox
                  id="save-payment"
                  checked={savePaymentMethod}
                  onCheckedChange={(checked) => setSavePaymentMethod(checked as boolean)}
                />
                <div className="flex-1">
                  <label 
                    htmlFor="save-payment" 
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Save payment method for future purchases
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Securely save this card for faster checkout next time
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>${amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Your payment information is encrypted and secure</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing || isSubmitting}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {(isProcessing || isSubmitting) ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Complete Payment ${amount.toFixed(2)}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ModernPaymentForm;