
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
}

const StripePaymentForm = ({
  clientSecret,
  amount,
  onSuccess,
  onError,
  isProcessing,
  onProcessingChange
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    onProcessingChange(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Payment form not loaded properly');
      onProcessingChange(false);
      return;
    }

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      onError(err.message || 'Payment failed');
      toast.error(err.message || 'Payment failed');
    } finally {
      onProcessingChange(false);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement options={cardElementOptions} />
      </div>

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
          className="min-w-[120px]"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
