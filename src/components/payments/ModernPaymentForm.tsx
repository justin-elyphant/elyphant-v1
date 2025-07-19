
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface ModernPaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string, saveCard: boolean) => void;
  allowSaveCard?: boolean;
  buttonText?: string;
}

const ModernPaymentForm: React.FC<ModernPaymentFormProps> = ({
  clientSecret,
  amount,
  onSuccess,
  allowSaveCard = false,
  buttonText = 'Pay Now'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Payment form not loaded properly');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Add billing details if needed
            },
          },
          setup_future_usage: saveCard && user ? 'off_session' : undefined,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Save payment method if requested
        if (saveCard && user && paymentIntent.payment_method) {
          await savePaymentMethod(paymentIntent.payment_method);
        }

        toast.success('Payment successful!');
        onSuccess(paymentIntent.id, saveCard);
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const savePaymentMethod = async (paymentMethodId: any) => {
    try {
      // Get payment method details from Stripe
      if (!stripe) return;
      
      // Payment method details are already available from the paymentIntent
      const paymentMethod = paymentMethodId;
      if (!paymentMethod?.card) return;

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user!.id,
          stripe_payment_method_id: paymentMethod.id,
          last_four: paymentMethod.card.last4,
          card_type: paymentMethod.card.brand,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          is_default: false
        });

      if (error) {
        console.error('Error saving payment method:', error);
      } else {
        toast.success('Payment method saved for future use');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">Card Details</span>
            <Lock className="h-4 w-4 text-green-600 ml-auto" />
          </div>
          
          <div className="p-4 border rounded-lg bg-white">
            <CardElement options={cardElementOptions} />
          </div>

          {allowSaveCard && user && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-card"
                checked={saveCard}
                onCheckedChange={(checked) => setSaveCard(checked as boolean)}
              />
              <Label htmlFor="save-card" className="text-sm">
                Save this card for future purchases
              </Label>
            </div>
          )}

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Your payment information is encrypted and secure
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <div className="text-lg font-semibold">
          Total: ${amount.toFixed(2)}
        </div>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="min-w-[140px]"
        >
          {isProcessing ? 'Processing...' : buttonText}
        </Button>
      </div>
    </form>
  );
};

export default ModernPaymentForm;
