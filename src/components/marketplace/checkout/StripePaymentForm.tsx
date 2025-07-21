
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string, paymentMethodId?: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
  savePaymentMethod?: boolean;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const StripePaymentForm = ({
  clientSecret,
  amount,
  onSuccess,
  onError,
  isProcessing,
  onProcessingChange,
  savePaymentMethod = false,
  shippingAddress
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [useSameAddress, setUseSameAddress] = useState(true);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting || isProcessing) {
      return;
    }

    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name');
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
      // Prepare billing details
      const billingDetails: any = {
        name: cardholderName.trim(),
      };

      // Use shipping address as billing if requested and available
      if (useSameAddress && shippingAddress) {
        billingDetails.address = {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country === 'United States' ? 'US' : shippingAddress.country,
        };
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: billingDetails,
          },
          setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
        }
      );

      if (confirmError) {
        // Handle specific error types
        if (confirmError.type === 'card_error') {
          throw new Error(confirmError.message || 'Your card was declined');
        } else {
          throw new Error(confirmError.message || 'Payment failed');
        }
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        // Pass both payment intent ID and payment method ID if available
        const paymentMethodId = paymentIntent.payment_method as string;
        onSuccess(paymentIntent.id, paymentMethodId);
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardholder-name">Cardholder Name</Label>
          <Input
            id="cardholder-name"
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Enter cardholder name"
            required
          />
        </div>

        {shippingAddress && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="same-address"
              checked={useSameAddress}
              onChange={(e) => setUseSameAddress(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="same-address" className="text-sm">
              Billing address same as shipping address
            </Label>
          </div>
        )}

        <div className="p-4 border rounded-lg bg-white">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <CardElement options={cardElementOptions} />
        </div>
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
          disabled={!stripe || isProcessing || isSubmitting || !cardholderName.trim()}
          className="min-w-[120px]"
        >
          {(isProcessing || isSubmitting) ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
