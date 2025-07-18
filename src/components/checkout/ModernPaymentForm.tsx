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
      // Create payment method first if user wants to save it
      let paymentMethodToSave = null;
      if (savePaymentMethod && user) {
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        });

        if (pmError) {
          throw new Error(pmError.message || 'Failed to create payment method');
        }
        paymentMethodToSave = paymentMethod;
      }

      // Process the payment
      const confirmPaymentData: any = {
        payment_method: paymentMethodToSave ? paymentMethodToSave.id : {
          card: cardElement,
          billing_details: {
            email: user?.email,
          },
        },
      };

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        confirmPaymentData
      );

      if (confirmError) {
        if (confirmError.type === 'card_error') {
          throw new Error(confirmError.message || 'Your card was declined');
        } else {
          throw new Error(confirmError.message || 'Payment failed');
        }
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // If user wants to save payment method and we created one
        if (savePaymentMethod && user && paymentMethodToSave) {
          try {
            const { error: dbError } = await supabase
              .from('payment_methods')
              .insert({
                user_id: user.id,
                stripe_payment_method_id: paymentMethodToSave.id,
                card_type: paymentMethodToSave.card?.brand || 'unknown',
                last_four: paymentMethodToSave.card?.last4 || '0000',
                exp_month: paymentMethodToSave.card?.exp_month || 1,
                exp_year: paymentMethodToSave.card?.exp_year || 2030,
              });

            if (dbError) {
              console.error('Error saving payment method:', dbError);
            } else {
              toast.success('Payment successful and card saved for future use!');
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
            toast.success('Payment successful! (Card could not be saved)');
          }
        } else {
          toast.success('Payment successful!');
        }
        
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
        fontSize: '16px',
        color: 'hsl(var(--foreground))',
        fontFamily: 'system-ui, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
        padding: '12px 0',
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {typeof getCardIcon(cardBrand) === 'string' ? (
              <span className="text-lg">{getCardIcon(cardBrand)}</span>
            ) : (
              getCardIcon(cardBrand)
            )}
            Payment Details
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <Shield className="h-3 w-3" />
            Secure
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Input Section */}
          <div className="space-y-3">
            <div className="border border-border rounded-lg p-3 bg-card transition-all duration-200 hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Card Information
              </label>
              <CardElement 
                options={cardElementOptions} 
                onChange={handleCardChange}
                className="min-h-[40px]"
              />
            </div>

            {/* Save Payment Method Option */}
            {user && (
              <div className="flex items-start space-x-2 p-3 border rounded-lg bg-muted/30">
                <Checkbox
                  id="save-payment"
                  checked={savePaymentMethod}
                  onCheckedChange={(checked) => setSavePaymentMethod(checked as boolean)}
                  className="mt-0.5"
                />
                <label 
                  htmlFor="save-payment" 
                  className="text-sm cursor-pointer flex items-center gap-2 leading-tight"
                >
                  <Lock className="h-3 w-3" />
                  Save for future purchases
                </label>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Order Summary & Security - Combined */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1 border-t">
              <Shield className="h-3 w-3" />
              <span>Encrypted & secure payment</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing || isSubmitting}
            className="w-full h-10"
          >
            {(isProcessing || isSubmitting) ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Pay ${amount.toFixed(2)}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ModernPaymentForm;